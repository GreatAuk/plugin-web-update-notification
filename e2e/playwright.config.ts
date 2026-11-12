import { defineConfig, devices } from '@playwright/test'
import type { TargetOptions } from './fixtures'
import { targets } from './targets'

export default defineConfig<TargetOptions>({
  testDir: '.',
  outputDir: 'test-results',
  // 每个 target 在 worker fixture 中构建并托管；nuxt 三种模式共用 .output，必须串行
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'],
    trace: 'on-first-retry',
  },
  projects: targets.map((target) => ({ name: target.name, use: { target } })),
})
