import asyncio
from playwright.async_api import async_playwright, expect
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Navigate to the local server
        url = "http://localhost:8000/index.html"
        print(f"Navigating to: {url}")
        await page.goto(url, wait_until="networkidle")

        # Wait for the narrative container to be visible
        narrative_container = page.locator("#narrative-container")
        await expect(narrative_container).to_be_visible(timeout=15000)

        # Wait for the first story text chunk to appear
        first_chunk = page.locator(".story-text-chunk").first
        await expect(first_chunk).to_be_visible(timeout=10000)

        # Wait for a second to let the word-by-word animation progress
        await asyncio.sleep(1)

        # Take a screenshot to verify the animation
        screenshot_path = "jules-scratch/verification/word_by_word_verification.png"
        await page.screenshot(path=screenshot_path)

        await browser.close()
        print(f"Screenshot saved to {screenshot_path}")

if __name__ == "__main__":
    asyncio.run(main())
