import {
  DIRECTORY_NAME,
  INJECT_SCRIPT_FILE_NAME,
  INJECT_SCRIPT_TAG_ID,
  INJECT_STYLE_FILE_NAME,
  NOTIFICATION_ANCHOR_CLASS_NAME,
} from './constant'
import type { Options } from './type'

/** `<head>`, `<HEAD>`, `<head lang="zh">`, `<head\n>`; `<header>` is not matched */
const HEAD_OPEN_RE = /<head(?:\s[^>]*)?>/i
/** `<html>` with any attributes, used when the document has no `<head>` tag */
const HTML_OPEN_RE = /<html(?:\s[^>]*)?>/i
/** a leading `<!DOCTYPE ...>`, so tags are never placed in front of it */
const DOCTYPE_RE = /^\s*<!doctype[^>]*>/i
/** `</body>`, `</BODY>`, `</body >` */
const BODY_CLOSE_RE = /<\/body\s*>/gi
/** `</html>`, used when the document has no `</body>` tag */
const HTML_CLOSE_RE = /<\/html\s*>/gi

function insertAt(source: string, index: number, content: string) {
  return source.slice(0, index) + content + source.slice(index)
}

function lastMatchIndex(source: string, re: RegExp) {
  let index = -1
  for (const match of source.matchAll(re)) index = match.index!
  return index
}

/**
 * Inserts `content` at the start of the document head.
 *
 * `<head>` and `<html>` are optional in HTML, so when they are missing the content goes after
 * `<html ...>`, then after the doctype, then at the very start. The browser puts the tags into the
 * implied head in all of these cases.
 */
function prependToHead(html: string, content: string) {
  for (const re of [HEAD_OPEN_RE, HTML_OPEN_RE, DOCTYPE_RE]) {
    const match = re.exec(html)
    if (match) return insertAt(html, match.index + match[0].length, content)
  }
  return content + html
}

/**
 * Inserts `content` at the end of the document body.
 *
 * The last `</body>` is used, as an earlier one may sit inside an inline script or a comment. When
 * `</body>` is missing the content goes before `</html>`, then at the very end.
 */
function appendToBody(html: string, content: string) {
  for (const re of [BODY_CLOSE_RE, HTML_CLOSE_RE]) {
    const index = lastMatchIndex(html, re)
    if (index !== -1) return insertAt(html, index, content)
  }
  return html + content
}

/**
 * Injects the version script, the notification stylesheet and the notification anchor into an HTML
 * string.
 *
 * Tags are matched case-insensitively and may carry attributes or whitespace, so `<HEAD>`,
 * `<head lang="zh">` and `<head\n>` all work. Content is inserted by index, so `$` in the version or
 * in `injectFileBase` is never treated as a replacement pattern.
 * @param html - The original HTML of the page
 * @param version - The version of the current build
 * @param options - Plugin options, `injectFileBase` defaults to `/`
 * @param hashes - Content hashes of the emitted script and style files
 * @returns The HTML with the script, the stylesheet and the anchor injected
 */
export function injectPluginHtml(
  html: string,
  version: string,
  options: Options,
  { cssFileHash, jsFileHash }: { jsFileHash: string; cssFileHash: string },
) {
  const { customNotificationHTML, hiddenDefaultNotification, injectFileBase = '/' } = options

  const cssLinkHtml =
    customNotificationHTML || hiddenDefaultNotification
      ? ''
      : `<link rel="stylesheet" href="${injectFileBase}${DIRECTORY_NAME}/${INJECT_STYLE_FILE_NAME}.${cssFileHash}.css">`

  let res = prependToHead(
    html,
    `
    ${cssLinkHtml}
    <script data-id="${INJECT_SCRIPT_TAG_ID}" data-v="${version}" src="${injectFileBase}${DIRECTORY_NAME}/${INJECT_SCRIPT_FILE_NAME}.${jsFileHash}.js"></script>`,
  )

  if (!hiddenDefaultNotification)
    res = appendToBody(res, `<div class="${NOTIFICATION_ANCHOR_CLASS_NAME}"></div>`)

  return res
}
