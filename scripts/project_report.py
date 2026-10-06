#!/usr/bin/env python3

from __future__ import annotations

import argparse
import html
import os
import subprocess
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Iterable


MARKER_FILES = (".git", "package.json", "pyproject.toml", "Cargo.toml", "go.mod")
EXCLUDED_DIR_NAMES = {
    ".Trash",
    "Library",
    "node_modules",
    ".cache",
    ".npm",
    ".pnpm-store",
    ".cursor",
    ".codex",
    ".agents",
    ".git",
    ".continue",
    ".nvm",
    ".pyenv",
}

ACTIVE_GIT_DAYS = 21
ACTIVE_DIR_DAYS = 7
ACTIVE_RECENT_FILES = 100
STALE_TOUCH_DAYS = 30
STALE_GIT_DAYS = 60


@dataclass
class ProjectStatus:
    path: Path
    folder_mtime: datetime
    recent_file_count: int
    last_commit_date: datetime | None
    last_commit_sha: str | None
    last_commit_subject: str | None
    bucket: str
    reason: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate a 3-bucket project activity report."
    )
    parser.add_argument(
        "--root",
        default=str(Path.home()),
        help="Root directory to scan. Defaults to the current home directory.",
    )
    parser.add_argument(
        "--max-depth",
        type=int,
        default=1,
        help="Maximum directory depth to scan for project markers. Defaults to 1.",
    )
    parser.add_argument(
        "--output",
        default=str(Path.home() / "reports" / "project-status" / "latest.md"),
        help="Markdown output path.",
    )
    parser.add_argument(
        "--browser-base-url",
        default="http://127.0.0.1:8765",
        help="Base URL for browser-friendly report links.",
    )
    return parser.parse_args()


def iter_projects(root: Path, max_depth: int) -> Iterable[Path]:
    seen: set[Path] = set()
    root_depth = len(root.parts)

    for current_root, dirs, files in os.walk(root):
        current = Path(current_root)
        depth = len(current.parts) - root_depth
        has_git_dir = ".git" in dirs
        has_manifest = any(marker in files for marker in MARKER_FILES[1:])

        dirs[:] = [
            name
            for name in dirs
            if name not in EXCLUDED_DIR_NAMES and not name.startswith(".")
        ]

        if depth > max_depth:
            dirs[:] = []
            continue

        if current == root:
            continue

        if has_manifest or has_git_dir:
            seen.add(current)

    for project in sorted(seen):
        yield project


def git_last_commit(project: Path) -> tuple[datetime | None, str | None, str | None]:
    git_dir = project / ".git"
    if not git_dir.exists():
        return None, None, None

    try:
        output = subprocess.check_output(
            [
                "git",
                "-C",
                str(project),
                "log",
                "-1",
                "--format=%cs|%h|%s",
            ],
            stderr=subprocess.DEVNULL,
            text=True,
        ).strip()
    except subprocess.CalledProcessError:
        return None, None, None

    if not output:
        return None, None, None

    date_text, sha, subject = output.split("|", 2)
    return datetime.strptime(date_text, "%Y-%m-%d"), sha, subject


def recent_file_count(project: Path, since: datetime) -> int:
    days = max(0, (datetime.now() - since).days)

    try:
        output = subprocess.check_output(
            [
                "find",
                str(project),
                "-path",
                str(project / ".git"),
                "-prune",
                "-o",
                "-type",
                "f",
                "-mtime",
                f"-{days}",
                "-print",
            ],
            stderr=subprocess.DEVNULL,
            text=True,
        )
        return sum(1 for line in output.splitlines() if line)
    except subprocess.CalledProcessError:
        count = 0
        for current_root, dirs, files in os.walk(project):
            dirs[:] = [
                name for name in dirs if name not in EXCLUDED_DIR_NAMES and name != ".git"
            ]
            for filename in files:
                file_path = Path(current_root) / filename
                try:
                    if datetime.fromtimestamp(file_path.stat().st_mtime) >= since:
                        count += 1
                except OSError:
                    continue
        return count


def classify_project(
    folder_mtime: datetime,
    recent_files: int,
    commit_date: datetime | None,
    now: datetime,
) -> tuple[str, str]:
    active_git_cutoff = now - timedelta(days=ACTIVE_GIT_DAYS)
    active_dir_cutoff = now - timedelta(days=ACTIVE_DIR_DAYS)
    stale_dir_cutoff = now - timedelta(days=STALE_TOUCH_DAYS)
    stale_git_cutoff = now - timedelta(days=STALE_GIT_DAYS)

    if commit_date and commit_date >= active_git_cutoff:
        return "active", f"git commit within {ACTIVE_GIT_DAYS} days"

    if folder_mtime >= active_dir_cutoff and recent_files >= ACTIVE_RECENT_FILES:
        return (
            "active",
            f"folder touched within {ACTIVE_DIR_DAYS} days and {recent_files} files changed in 30 days",
        )

    if (
        folder_mtime >= stale_dir_cutoff
        or recent_files > 0
        or (commit_date and commit_date >= stale_git_cutoff)
    ):
        return "stale-but-touched", "recent filesystem activity without strong active signal"

    return "inactive", "no recent git or filesystem activity"


def collect_statuses(root: Path, max_depth: int) -> list[ProjectStatus]:
    now = datetime.now()
    recent_since = now - timedelta(days=30)
    statuses: list[ProjectStatus] = []

    for project in iter_projects(root, max_depth):
        folder_mtime = datetime.fromtimestamp(project.stat().st_mtime)
        commit_date, commit_sha, commit_subject = git_last_commit(project)
        recent_files = recent_file_count(project, recent_since)
        bucket, reason = classify_project(folder_mtime, recent_files, commit_date, now)
        statuses.append(
            ProjectStatus(
                path=project,
                folder_mtime=folder_mtime,
                recent_file_count=recent_files,
                last_commit_date=commit_date,
                last_commit_sha=commit_sha,
                last_commit_subject=commit_subject,
                bucket=bucket,
                reason=reason,
            )
        )

    return statuses


def render_bucket(name: str, items: list[ProjectStatus]) -> list[str]:
    lines = [f"## {name.title()}"]
    if not items:
        lines.append("- None")
        return lines

    for item in sorted(items, key=lambda entry: entry.path.name.lower()):
        commit = (
            f"{item.last_commit_date.date()} {item.last_commit_sha}"
            if item.last_commit_date and item.last_commit_sha
            else "none"
        )
        lines.append(
            "- "
            f"`{item.path.name}`"
            f" | folder `{item.folder_mtime.strftime('%Y-%m-%d %H:%M')}`"
            f" | recent files(30d) `{item.recent_file_count}`"
            f" | last commit `{commit}`"
            f" | {item.reason}"
        )
    return lines


def render_report(statuses: list[ProjectStatus], root: Path) -> str:
    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M")
    lines = [
        "# Project Status Report",
        "",
        f"- Root: `{root}`",
        f"- Generated: `{generated_at}`",
        "- Buckets:",
        f"  - `active`: git commit within {ACTIVE_GIT_DAYS} days, or touched within {ACTIVE_DIR_DAYS} days with at least {ACTIVE_RECENT_FILES} changed files in the last 30 days",
        "  - `stale-but-touched`: some recent filesystem or git activity, but weaker than the active threshold",
        "  - `inactive`: no recent git or filesystem activity",
        "",
    ]

    for bucket in ("active", "stale-but-touched", "inactive"):
        lines.extend(render_bucket(bucket, [s for s in statuses if s.bucket == bucket]))
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def render_report_html(statuses: list[ProjectStatus], root: Path) -> str:
    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M")
    bucket_meta = [
        (
            "active",
            f"git commit within {ACTIVE_GIT_DAYS} days, or touched within {ACTIVE_DIR_DAYS} days with at least {ACTIVE_RECENT_FILES} changed files in the last 30 days",
        ),
        (
            "stale-but-touched",
            "some recent filesystem or git activity, but weaker than the active threshold",
        ),
        ("inactive", "no recent git or filesystem activity"),
    ]

    sections: list[str] = []
    for bucket, _description in bucket_meta:
        items = [s for s in statuses if s.bucket == bucket]
        if items:
            rows = []
            for item in sorted(items, key=lambda entry: entry.path.name.lower()):
                commit = (
                    f"{item.last_commit_date.date()} {item.last_commit_sha}"
                    if item.last_commit_date and item.last_commit_sha
                    else "none"
                )
                rows.append(
                    "<tr>"
                    f"<td>{html.escape(item.path.name)}</td>"
                    f"<td>{html.escape(item.folder_mtime.strftime('%Y-%m-%d %H:%M'))}</td>"
                    f"<td>{item.recent_file_count}</td>"
                    f"<td>{html.escape(commit)}</td>"
                    f"<td>{html.escape(item.reason)}</td>"
                    "</tr>"
                )
            body = (
                "<table><thead><tr>"
                "<th>Project</th><th>Folder Touched</th><th>Recent Files (30d)</th><th>Last Commit</th><th>Reason</th>"
                "</tr></thead><tbody>"
                + "".join(rows)
                + "</tbody></table>"
            )
        else:
            body = "<p class='empty'>None</p>"

        sections.append(
            "<section>"
            f"<h2>{html.escape(bucket.title())}</h2>"
            f"{body}"
            "</section>"
        )

    bucket_list = "".join(
        f"<li><strong>{html.escape(name)}</strong>: {html.escape(description)}</li>"
        for name, description in bucket_meta
    )

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Project Status Report</title>
  <style>
    :root {{
      color-scheme: light dark;
      --bg: #0b0f14;
      --panel: #121821;
      --text: #edf2f7;
      --muted: #a0aec0;
      --border: #2d3748;
      --accent: #7dd3fc;
    }}
    @media (prefers-color-scheme: light) {{
      :root {{
        --bg: #f7fafc;
        --panel: #ffffff;
        --text: #1a202c;
        --muted: #4a5568;
        --border: #e2e8f0;
        --accent: #0369a1;
      }}
    }}
    body {{
      margin: 0;
      padding: 32px;
      background: var(--bg);
      color: var(--text);
      font: 16px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }}
    main {{
      max-width: 1200px;
      margin: 0 auto;
    }}
    .meta, section {{
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 20px 24px;
      margin-bottom: 20px;
    }}
    h1, h2 {{
      margin: 0 0 12px;
    }}
    ul {{
      margin: 0;
      padding-left: 20px;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }}
    th, td {{
      text-align: left;
      padding: 10px 12px;
      border-top: 1px solid var(--border);
      vertical-align: top;
    }}
    th {{
      color: var(--muted);
      font-weight: 600;
    }}
    code {{
      color: var(--accent);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }}
    .empty {{
      color: var(--muted);
      margin: 0;
    }}
  </style>
</head>
<body>
  <main>
    <section class="meta">
      <h1>Project Status Report</h1>
      <p><strong>Root:</strong> <code>{html.escape(str(root))}</code></p>
      <p><strong>Generated:</strong> <code>{html.escape(generated_at)}</code></p>
      <ul>{bucket_list}</ul>
    </section>
    {''.join(sections)}
  </main>
</body>
</html>
"""


def main() -> int:
    args = parse_args()
    root = Path(args.root).expanduser().resolve()
    output = Path(args.output).expanduser().resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    html_output = output.with_suffix(".html")
    reports_root = (Path.home() / "reports").resolve()

    statuses = collect_statuses(root, args.max_depth)
    report = render_report(statuses, root)
    report_html = render_report_html(statuses, root)
    output.write_text(report, encoding="utf-8")
    html_output.write_text(report_html, encoding="utf-8")

    browser_url = None
    try:
        relative_html = html_output.relative_to(reports_root)
        browser_url = (
            args.browser_base_url.rstrip("/") + "/" + relative_html.as_posix()
        )
    except ValueError:
        browser_url = None

    if browser_url:
        print(browser_url)
    print(output)
    print(html_output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
