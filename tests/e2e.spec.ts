import { test, expect } from "@playwright/test";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

test.describe("DraftMaps E2E", () => {
    test("home page loads and displays the map", async ({ page }) => {
        await page.goto(`${BASE_URL}/`);

        // Wait for network to be idle (JS and assets loaded)
        await page.waitForLoadState("networkidle");

        // Verify header
        await expect(page.getByText("DraftMaps")).toBeVisible();
        await expect(page.getByText("Places to chill")).toBeVisible();

        // Verify map container is rendered (Leaflet on web)
        // Wait up to 15 seconds for the map to initialize
        const mapContainer = page.locator(".leaflet-container");
        await expect(mapContainer).toBeVisible({ timeout: 15000 });
    });

    test("navigate to location detail page and back", async ({ page }) => {
        await page.goto(`${BASE_URL}/`);
        await page.waitForLoadState("networkidle");
        await page.waitForSelector(".leaflet-container", { timeout: 15000 });

        // Navigate directly to a location detail page (simulating the app flow)
        await page.goto(`${BASE_URL}/locations/goiania-node-2526787874`);
        await page.waitForLoadState("networkidle");

        // Verify we are on the detail page and the location loaded
        await expect(page.getByText("Biscoitos Pereira")).toBeVisible({ timeout: 15000 });
        await expect(page.getByText("Open route")).toBeVisible({ timeout: 15000 });

        // Verify back button works
        const backButton = page.getByRole("button", { name: "Back" });
        await expect(backButton).toBeVisible({ timeout: 15000 });
        await backButton.click();

        // Verify we are back on the home page
        await expect(page.getByText("DraftMaps")).toBeVisible({ timeout: 15000 });
        await expect(page.locator(".leaflet-container")).toBeVisible({ timeout: 15000 });
    });

    test("detail page shows location information", async ({ page }) => {
        // Navigate directly to a location detail page using a real ID from the API
        await page.goto(`${BASE_URL}/locations/goiania-node-2526787874`);
        await page.waitForLoadState("networkidle");

        // Wait for the page to load and location data to be fetched
        await expect(page.getByText("Open route")).toBeVisible({ timeout: 15000 });

        // Verify location details
        await expect(page.getByText("Biscoitos Pereira")).toBeVisible();
        await expect(page.getByText("Cafe")).toBeVisible();

        // Verify coordinates section
        await expect(page.getByText("Coordinates")).toBeVisible();

        // Verify data source
        await expect(page.getByText("Data source")).toBeVisible();
    });

    test("detail page shows error for invalid location", async ({ page }) => {
        await page.goto(`${BASE_URL}/locations/invalid-id`);
        await page.waitForLoadState("networkidle");

        // The app shows the generic error screen with the specific error message
        await expect(page.getByText("Something went wrong")).toBeVisible({ timeout: 15000 });
        await expect(page.getByText("Location not found")).toBeVisible();
        await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
    });
});
