import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const distDir = resolve(__dirname, '../dist')

// Regression: global Window augmentation must be present in every emitted declaration file,
// otherwise `/// <reference types="@plugin-web-update-notification/vite" />` loses its types.
describe.skipIf(!existsSync(resolve(distDir, 'index.d.mts')))('dist type declarations', () => {
  it.each(['index.d.mts', 'index.d.cts'])('%s contains global augmentation', (file) => {
    const content = readFileSync(resolve(distDir, file), 'utf-8')
    expect(content).toContain('pluginWebUpdateNotice_')
    expect(content).toContain('plugin_web_update_notice')
  })
})
