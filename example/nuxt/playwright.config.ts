import type { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: "tests/e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    trace: "on-first-retry",
    baseURL: "http://localhost:3000",
  },
  projects: [
    { name: "ssr", testMatch: "ssr.spec.ts" },
    { name: "spa", testMatch: "spa.spec.ts" },
    { name: "ssg", testMatch: "ssg.spec.ts" },
  ],
};
export default config;
