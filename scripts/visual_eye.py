#!/usr/bin/env python3
import asyncio
import os
import sys
import json
from playwright.async_api import async_playwright

async def run_visual_audit(file_path):
    abs_path = os.path.abspath(file_path)
    url = f"file://{abs_path}"
    print(f"[EYE] Initiating visual inspection for: {url}")

    console_errors = []
    failed_requests = []
    logs = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Set standard desktop dimensions
        context = await browser.new_context(viewport={'width': 1440, 'height': 900})
        page = await context.new_page()

        # Listen for console errors or logs
        page.on("pageerror", lambda err: console_errors.append(str(err)))
        page.on("console", lambda msg: logs.append(f"[{msg.type}] {msg.text}") if msg.type in ["error", "warning"] else None)

        # Track failed resource requests
        page.on("requestfailed", lambda req: failed_requests.append(f"{req.url} -> {req.failure}"))

        try:
            # Navigate to the local file
            await page.goto(url, wait_until="domcontentloaded")
            await page.wait_for_timeout(2000)

            # Extract basic structure validation
            title = await page.title()
            root_text = await page.evaluate("() => document.getElementById('root') ? document.getElementById('root').innerText : ''")
            
            # Interactive flow validation: cycle through the navigation buttons to verify rendering
            nav_tabs = ["overview", "governance", "audits", "voice", "agents", "automation", "reports", "sovereignty"]
            tabs_visited = []

            for tab in nav_tabs:
                btn_id = f"nav-{tab}"
                btn_exists = await page.evaluate(f"() => !!document.getElementById('{btn_id}')")
                if btn_exists:
                    # Click the nav tab button
                    await page.click(f"#{btn_id}")
                    await page.wait_for_timeout(300)
                    # Check if corresponding tab section is marked active
                    section_active = await page.evaluate(f"() => document.getElementById('tab-{tab}').classList.contains('active')")
                    tabs_visited.append({"tab": tab, "clicked": True, "active": section_active})
                else:
                    tabs_visited.append({"tab": tab, "clicked": False, "active": False})

            # Return to overview tab for the primary screenshot representation
            if await page.evaluate("() => !!document.getElementById('nav-overview')"):
                await page.click("#nav-overview")
                await page.wait_for_timeout(500)

            # Capture visual screenshot representing the current layout state
            screenshot_path = "sentinel_preview.png"
            await page.screenshot(path=screenshot_path, full_page=True)
            print(f"[EYE] Layout screenshot saved to: {screenshot_path}")

            report = {
                "url": url,
                "title": title,
                "text_length": len(root_text),
                "tabs_validated": tabs_visited,
                "console_errors": console_errors,
                "failed_requests": failed_requests,
                "warning_logs": logs,
                "status": "PASS" if len(console_errors) == 0 and len(failed_requests) == 0 else "FAIL"
            }

            # Dump report details
            print("\n================== EYE REPORT ==================")
            print(json.dumps(report, indent=2))
            print("================================================\n")

            if report["status"] == "FAIL":
                print(f"[EYE] WARNING: Found {len(console_errors)} console errors and {len(failed_requests)} failed requests.")
                sys.exit(1)
            else:
                print("[EYE] Visual and script validation check: SUCCESS.")
                sys.exit(0)

        except Exception as e:
            print(f"[EYE] CRITICAL CRASH: {e}")
            sys.exit(2)
        finally:
            await browser.close()

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "sentinel-dashboard.html"
    asyncio.run(run_visual_audit(target))
