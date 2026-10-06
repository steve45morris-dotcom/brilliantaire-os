import asyncio
import sys
from playwright.async_api import async_playwright

async def test_link(url):
    print(f"SENTINEL: Final check for {url}...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        try:
            await page.goto(url, wait_until="domcontentloaded")
            await page.wait_for_timeout(3000)
            
            data = await page.evaluate("""() => {
                const root = document.getElementById('root');
                const text = root.innerText;
                return {
                    textLength: text.length,
                    hasNav: text.includes('Mission Control') || text.includes('MISSION_CONTROL'),
                    hasAgents: text.includes('Active Agents') || text.includes('AGENT_REGISTRY'),
                    bodyStyle: getComputedStyle(document.body).backgroundColor
                };
            }""")
            print(f"REPORT: {data}")
            await browser.close()
        except Exception as e:
            print(f"ERROR: {e}")
            await browser.close()

if __name__ == "__main__":
    asyncio.run(test_link(sys.argv[1]))
