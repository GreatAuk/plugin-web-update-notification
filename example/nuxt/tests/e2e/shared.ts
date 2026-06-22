import { test, expect } from "@playwright/test";
import {
  DIRECTORY_NAME,
  NOTIFICATION_ANCHOR_CLASS_NAME,
  INJECT_STYLE_FILE_NAME,
  INJECT_SCRIPT_FILE_NAME,
  INJECT_SCRIPT_TAG_ID,
  JSON_FILE_NAME,
  NOTIFICATION_DISMISS_BTN_CLASS_NAME,
} from "@plugin-web-update-notification/core";

/**
 * Shared assertions run once per rendering mode (ssr/spa/ssg). Selectors avoid
 * matching on the content-hashed file names (e.g. inject.<hash>.js) since the
 * hash changes every build - matching vue-vite3's spec literally on
 * `${INJECT_SCRIPT_FILE_NAME}.js` is a latent bug that never matches.
 */
export function registerCoreInjectionSuite(modeLabel: "ssr" | "spa" | "ssg") {
  test.describe(`@plugin-web-update-notification/nuxt - ${modeLabel}`, () => {
    test("raw html response (no browser JS) contains injected script/style/anchor", async ({
      request,
    }) => {
      const res = await request.get("/");
      expect(res.ok()).toBeTruthy();
      const html = await res.text();

      expect(html).toContain(`data-id="${INJECT_SCRIPT_TAG_ID}"`);
      expect(html).toMatch(
        new RegExp(
          `<script[^>]*src="[^"]*${DIRECTORY_NAME}/${INJECT_SCRIPT_FILE_NAME}\\.[^"]+\\.js"`
        )
      );
      expect(html).toMatch(
        new RegExp(
          `<link[^>]*href="[^"]*${DIRECTORY_NAME}/${INJECT_STYLE_FILE_NAME}\\.[^"]+\\.css"`
        )
      );
      expect(html).toContain(`class="${NOTIFICATION_ANCHOR_CLASS_NAME}"`);
    });

    test(`should have a ${JSON_FILE_NAME}.json file`, async ({ request }) => {
      const jsonFileRes = await request.get(
        `${DIRECTORY_NAME}/${JSON_FILE_NAME}.json`
      );
      expect(jsonFileRes.ok()).toBeTruthy();

      const res = await jsonFileRes.json();
      expect(res).toHaveProperty("version");
      expect(typeof res?.version).toBe("string");
      expect(res.version.length).toBeGreaterThan(0);
    });

    test("notification anchor element should exist in the DOM", async ({
      page,
    }) => {
      await page.goto("/");
      const anchor = page.locator(`.${NOTIFICATION_ANCHOR_CLASS_NAME}`);
      expect(await anchor.count()).toEqual(1);
    });

    test("don't show notification when version is unchanged", async ({
      page,
    }) => {
      await page.goto("/");
      const notificationContent = page.locator(
        `[data-cy="notification-content"]`
      );
      expect(await notificationContent.count()).toEqual(0);
    });

    test("should show a notification after a simulated system update", async ({
      page,
    }) => {
      await page.goto("/");
      await page.route(`**/${JSON_FILE_NAME}.json?*`, async (route) => {
        const response = await page.request.fetch(route.request());
        const body = await response.json();
        body.version = "1234567";
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
      expect(await notificationContent.count()).toEqual(1);
      expect(await notificationContent.innerHTML()).toContain("system update");
      expect(await notificationContent.innerHTML()).toContain("refresh");
    });

    test("dismiss feature removes the notification", async ({ page }) => {
      await page.goto("/");
      await page.route(`**/${JSON_FILE_NAME}.json?*`, async (route) => {
        const response = await page.request.fetch(route.request());
        const body = await response.json();
        body.version = "7654321";
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
      expect(await notificationContent.innerHTML()).toContain("dismiss");
      await page.locator(`.${NOTIFICATION_DISMISS_BTN_CLASS_NAME}`)?.click();

      expect(
        await page
          .locator(
            `.${NOTIFICATION_ANCHOR_CLASS_NAME} .plugin-web-update-notice`
          )
          .count()
      ).toBe(0);
    });
  });
}
