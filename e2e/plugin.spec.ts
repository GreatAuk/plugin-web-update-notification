import type { Page } from '@playwright/test'
import {
  DIRECTORY_NAME,
  INJECT_SCRIPT_FILE_NAME,
  INJECT_SCRIPT_TAG_ID,
  INJECT_STYLE_FILE_NAME,
  JSON_FILE_NAME,
  NOTIFICATION_ANCHOR_CLASS_NAME,
  NOTIFICATION_DISMISS_BTN_CLASS_NAME,
} from '../packages/core/src/constant'
import { expect, test } from './fixtures'

const NOTIFICATION_SELECTOR = '[data-cy="notification-content"]'

/** 篡改服务端返回的版本号，模拟线上已发布新版本 */
async function mockNewVersion(page: Page) {
  await page.route(`**/${DIRECTORY_NAME}/${JSON_FILE_NAME}.json?*`, async (route) => {
    const response = await route.fetch()
    const body = await response.json()
    await route.fulfill({ response, json: { ...body, version: 'e2e-new-version' } })
  })
}

test('HTML 注入了检测脚本、样式与通知锚点', async ({ request }) => {
  const res = await request.get('/')
  expect(res.ok()).toBeTruthy()
  const html = await res.text()

  expect(html).toContain(`data-id="${INJECT_SCRIPT_TAG_ID}"`)
  // 文件名带内容哈希，按模式匹配
  expect(html).toMatch(
    new RegExp(`<script[^>]*src="[^"]*${DIRECTORY_NAME}/${INJECT_SCRIPT_FILE_NAME}\\.[^"]+\\.js"`),
  )
  expect(html).toMatch(
    new RegExp(`<link[^>]*href="[^"]*${DIRECTORY_NAME}/${INJECT_STYLE_FILE_NAME}\\.[^"]+\\.css"`),
  )
})

test('页面中存在通知锚点', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator(`.${NOTIFICATION_ANCHOR_CLASS_NAME}`)).toHaveCount(1)
})

test(`${JSON_FILE_NAME}.json 可访问且包含版本号`, async ({ request }) => {
  const res = await request.get(`/${DIRECTORY_NAME}/${JSON_FILE_NAME}.json`)
  expect(res.ok()).toBeTruthy()
  const { version } = await res.json()
  expect(typeof version).toBe('string')
  expect(version.length).toBeGreaterThan(0)
})

test('版本未变化时不显示通知', async ({ page }) => {
  const versionChecked = page.waitForResponse((res) => res.url().includes(`${JSON_FILE_NAME}.json`))
  await page.goto('/')
  await versionChecked
  await expect(page.locator(NOTIFICATION_SELECTOR)).toHaveCount(0)
})

test('版本变化后显示通知', async ({ page, target }) => {
  await mockNewVersion(page)
  await page.goto('/')
  const notification = page.locator(NOTIFICATION_SELECTOR)
  await expect(notification).toHaveCount(1)
  await expect(notification).toContainText(target.texts.title)
  await expect(notification).toContainText(target.texts.buttonText)
})

test('版本响应早于通知锚点解析时仍显示通知', async ({ page, target }) => {
  await mockNewVersion(page)
  // 在锚点前插入一个慢速同步脚本阻塞解析，模拟同步加载的大体积入口（如 umi.js）
  const blockScript = '/__e2e_block_parser__.js'
  await page.route(
    (url) => url.pathname === '/',
    async (route) => {
      const response = await route.fetch()
      const html = (await response.text()).replace(
        `<div class="${NOTIFICATION_ANCHOR_CLASS_NAME}"`,
        `<script src="${blockScript}"></script>$&`,
      )
      expect(html).toContain(blockScript)
      await route.fulfill({ response, body: html })
    },
  )
  await page.route(`**${blockScript}`, async (route) => {
    await new Promise((r) => setTimeout(r, 500))
    await route.fulfill({ contentType: 'text/javascript', body: '' })
  })
  await page.goto('/')
  await expect(page.locator(NOTIFICATION_SELECTOR)).toContainText(target.texts.title)
})

test('点击忽略后通知消失', async ({ page, target }) => {
  await mockNewVersion(page)
  await page.goto('/')
  const notification = page.locator(NOTIFICATION_SELECTOR)
  await expect(notification).toContainText(target.texts.dismissButtonText)
  await page.locator(`.${NOTIFICATION_DISMISS_BTN_CLASS_NAME}`).click()
  await expect(notification).toHaveCount(0)
})
