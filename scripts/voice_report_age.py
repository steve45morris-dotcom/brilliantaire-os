#!/usr/bin/env python3
"""Validate whether a queued voice report is recent enough to narrate."""

from __future__ import annotations

import sys
from datetime import datetime, timedelta

MAX_REPORT_AGE = timedelta(hours=24)
TIMESTAMP_FORMAT = "%Y-%m-%d %H:%M:%S"


def report_is_fresh(
    line: str,
    *,
    now: datetime | None = None,
    max_age: timedelta = MAX_REPORT_AGE,
) -> bool:
    try:
        report_time = datetime.strptime(line[:19], TIMESTAMP_FORMAT)
    except ValueError:
        return False

    current_time = now or datetime.now().astimezone()
    if current_time.tzinfo is not None:
        report_time = report_time.replace(tzinfo=current_time.tzinfo)
    age = current_time - report_time
    return age <= max_age


def main() -> int:
    if len(sys.argv) != 2:
        return 2
    return 0 if report_is_fresh(sys.argv[1]) else 1


if __name__ == "__main__":
    raise SystemExit(main())
