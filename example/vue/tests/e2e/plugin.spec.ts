import { test, expect } from "@playwright/test";
import {
  NOTIFICATION_ANCHOR_CLASS_NAME,
  INJECT_STYLE_FILE_NAME,
  INJECT_SCRIPT_FILE_NAME,
  JSON_FILE_NAME,
} from "@web-update-notification/core";

test.describe("test vite-plugin-web-update-notification", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });
  test("page access", async ({ page }) => {
    const title = page.locator("h1");
    await expect(title).toHaveText("You did it!");
  });
  test("script and css file inject success", async ({ page }) => {
    const scriptTag = page.locator(
      `script[src="${INJECT_SCRIPT_FILE_NAME}.js"]`
    );
    expect(await scriptTag.count()).toEqual(1);

    const cssTag = page.locator(`link[href="${INJECT_STYLE_FILE_NAME}.css"]`);
    expect(await cssTag.count()).toEqual(1);
  });

  test("notification anchor element should exist", async ({ page }) => {
    const anchor = page.locator(`.${NOTIFICATION_ANCHOR_CLASS_NAME}`);
    expect(await anchor.count()).toEqual(1);
  });

  test("should has a git-commit-hash.json file", async ({ page, request }) => {
    const jsonFileRes = await request.get(`${JSON_FILE_NAME}.json`);
    expect(jsonFileRes.ok()).toBeTruthy();

    const res = await jsonFileRes.json();
    expect(res).toHaveProperty("hash");
    expect(res?.hash).toHaveLength(7);
  });

  test("don't show notification when hash is the same", async ({ page }) => {
    const notificationContent = page.locator(
      `[data-cy="notification-content"]`
    );
    expect(await notificationContent.count()).toEqual(0);
  });

  test("should show a notification after system update", async ({ page }) => {
    // change the hash to force the notification
    await page.route(`**/${JSON_FILE_NAME}.json?*`, async (route) => {
      // Fetch original response.
      const response = await page.request.fetch(route.request());
      // Add a prefix to the title.
      const body = await response.json();
      body.hash = "1234567";
      route.fulfill({
        response,
        body: JSON.stringify(body),
        status: 200,
      });
    });
    await page.reload();
    const notificationContent = page.locator(
      `[data-cy="notification-content"]`
    );
    expect(await notificationContent.innerHTML()).toContain("system update");
    expect(await notificationContent.innerHTML()).toContain("refresh");
  });
});
