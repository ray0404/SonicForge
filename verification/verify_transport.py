from playwright.sync_api import sync_playwright

def verify_focus_visible():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app (assuming standard Vite port 5173)
        page.goto("http://localhost:5173")

        # Wait for the transport display to be visible
        # Use .first to handle responsive duplication
        seek_input = page.get_by_label("Seek").first
        seek_input.wait_for(state="attached")

        # Force focus on the input to trigger the focus-visible styles on the sibling
        seek_input.focus()

        # Simulate a key press to ensure keyboard focus
        page.keyboard.press("Tab")
        page.keyboard.press("Shift+Tab")

        # Take a screenshot of the transport area
        # We can locate the parent container of the seek input
        transport_container = seek_input.locator("..").locator("..")
        transport_container.screenshot(path="verification/transport_focus.png")

        browser.close()

if __name__ == "__main__":
    verify_focus_visible()
