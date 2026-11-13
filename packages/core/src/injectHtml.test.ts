import { describe, expect, it } from 'vitest'
import {
  DIRECTORY_NAME,
  INJECT_SCRIPT_FILE_NAME,
  INJECT_SCRIPT_TAG_ID,
  NOTIFICATION_ANCHOR_CLASS_NAME,
} from './constant'
import { injectPluginHtml } from './injectHtml'

const hashes = { jsFileHash: 'js123456', cssFileHash: 'css12345' }
const SCRIPT_MARK = `data-id="${INJECT_SCRIPT_TAG_ID}"`
const ANCHOR = `<div class="${NOTIFICATION_ANCHOR_CLASS_NAME}"></div>`

function inject(html: string, options = {}, version = 'v1') {
  return injectPluginHtml(html, version, options, hashes)
}

function count(source: string, part: string) {
  return source.split(part).length - 1
}

describe('injectPluginHtml', () => {
  it.each([
    ['<head>', '<html><head></head><body></body></html>'],
    ['<HEAD>', '<HTML><HEAD></HEAD><BODY></BODY></HTML>'],
    ['<head> with attributes', '<html><head lang="zh" data-x="1"></head><body></body></html>'],
    ['<head> with a line break', '<html><head\n></head><body></body></html>'],
    ['</body > with whitespace', '<html><head></head><body></body ></html>'],
  ])('injects into %s', (_, html) => {
    const res = inject(html)
    expect(count(res, SCRIPT_MARK)).toBe(1)
    expect(count(res, ANCHOR)).toBe(1)
    // the script lands inside head, the anchor at the end of body
    expect(res).toMatch(new RegExp(`<head[^>]*>\\s*<link[^>]+>\\s*<script ${SCRIPT_MARK}`, 'i'))
    expect(res).toMatch(new RegExp(`${ANCHOR}</body\\s*>`, 'i'))
  })

  it('does not mistake <header> for <head>', () => {
    const res = inject('<html><head></head><body><header></header></body></html>')
    expect(res.indexOf(SCRIPT_MARK)).toBeLessThan(res.indexOf('</head>'))
    expect(res).toContain('<body><header></header>')
  })

  it('appends the anchor before the last </body>', () => {
    const html = '<html><head></head><body><script>const s = "</body>"</script></body></html>'
    const res = inject(html)
    expect(res).toContain(`<script>const s = "</body>"</script>${ANCHOR}</body></html>`)
  })

  it('falls back to <html> and </html> when <head> and </body> are missing', () => {
    const res = inject('<!DOCTYPE html><html lang="en"><p>hi</p></html>')
    expect(res).toMatch(
      new RegExp(`^<!DOCTYPE html><html lang="en">\\s*<link[^>]+>\\s*<script ${SCRIPT_MARK}`),
    )
    expect(res).toMatch(new RegExp(`<p>hi</p>${ANCHOR}</html>$`))
  })

  it('keeps the doctype first when only the doctype is present', () => {
    const res = inject('<!doctype html><p>hi</p>')
    expect(res.startsWith('<!doctype html>')).toBe(true)
    expect(res).toContain(SCRIPT_MARK)
    expect(res.endsWith(`<p>hi</p>${ANCHOR}`)).toBe(true)
  })

  it('does not treat $ in the version or base as a replacement pattern', () => {
    const res = inject(
      '<html><head></head><body></body></html>',
      { injectFileBase: '/$&/' },
      "v$'1",
    )
    expect(res).toContain(`data-v="v$'1"`)
    expect(res).toContain('src="/$&/')
  })

  it('escapes HTML special characters in the version attribute', () => {
    const res = inject('<html><head></head><body></body></html>', {}, `a"b'c<d>&e`)
    expect(res).toContain(`data-v="a&quot;b'c&lt;d&gt;&amp;e"`)
  })

  it('skips the stylesheet and the anchor when the default notification is hidden', () => {
    const res = inject('<html><head></head><body></body></html>', {
      hiddenDefaultNotification: true,
    })
    expect(res).toContain(SCRIPT_MARK)
    expect(res).not.toContain('<link')
    expect(res).not.toContain(ANCHOR)
  })

  it('skips the stylesheet but keeps the anchor with custom notification HTML', () => {
    const res = inject('<html><head></head><body></body></html>', {
      customNotificationHTML: '<div></div>',
    })
    expect(res).not.toContain('<link')
    expect(res).toContain(ANCHOR)
  })

  it('uses / as the default injectFileBase', () => {
    const res = inject('<html><head></head><body></body></html>')
    expect(res).toContain(
      `src="/${DIRECTORY_NAME}/${INJECT_SCRIPT_FILE_NAME}.${hashes.jsFileHash}.js"`,
    )
  })
})
