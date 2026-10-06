import asyncio
import sys
import os
from playwright.async_api import async_playwright

async def test_logs_view(url):
    print(f"SENTINEL: Probing Logs View at {url}...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1280, 'height': 800})
        try:
            await page.goto(url, wait_until="domcontentloaded")
            await page.wait_for_timeout(2000)
            
            # Click the Logs button in sidebar
            # Based on Sidebar.tsx, it's a button with text "Logs"
            await page.click('button:has-text("Logs")')
            await page.wait_for_timeout(2000)
            
            data = await page.evaluate("""() => {
                const root = document.getElementById('root');
                const text = root.innerText;
                const hasLogsHeader = text.includes('Live_Stream_Log') || text.includes('LIVE_STREAM_LOG');
                const hasEvent = text.includes('HEARTBEAT') || text.includes('SYNC') || text.includes('EPIPHANY');
                return {
                    textLength: text.length,
                    hasLogsHeader,
                    hasEvent,
                    bodyBg: getComputedStyle(document.body).backgroundColor
                };
            }""")
            
            screenshot_path = "the-one-system-ui/public/reports/logs_view_fix.png"
            os.makedirs(os.path.dirname(screenshot_path), exist_ok=True)
            await page.screenshot(path=screenshot_path)
            
            print(f"REPORT: {data}")
            print(f"SCREENSHOT_SAVED: {screenshot_path}")
            await browser.close()
            return data['hasLogsHeader']
        except Exception as e:
            print(f"ERROR: {e}")
            await browser.close()
            return False

if __name__ == "__main__":
    asyncio.run(test_logs_view("http://localhost:5173"))
