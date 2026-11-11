import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DIRECTORY_NAME, INJECT_SCRIPT_TAG_ID, JSON_FILE_NAME } from '@plugin-web-update-notification/core'
import webpack from 'webpack'
import type { Configuration, Stats } from 'webpack'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { WebUpdateNotificationPlugin } from './index'

let dir: string
let outputPath: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'pwun-webpack-'))
  outputPath = join(dir, 'dist')
  writeFileSync(join(dir, 'entry.js'), 'console.log(1)')
  // stands in for the index.html that html-webpack-plugin writes during a build
  mkdirSync(outputPath)
  writeFileSync(join(outputPath, 'index.html'), '<html><head></head><body></body></html>')
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

function createCompiler(mode: Configuration['mode']) {
  // webpack() only returns null when given a callback
  return webpack({
    mode,
    context: dir,
    entry: './entry.js',
    output: { path: outputPath },
    plugins: [new WebUpdateNotificationPlugin({ versionType: 'custom', customVersion: 'v1' })],
  })!
}

function run(mode: Configuration['mode']) {
  const compiler = createCompiler(mode)
  return new Promise<void>((resolve, reject) => {
    compiler.run((err) => {
      compiler.close(() => (err ? reject(err) : resolve()))
    })
  })
}

/** Runs one watch build, then stops watching. */
function watchOnce(mode: Configuration['mode']) {
  const compiler = createCompiler(mode)
  return new Promise<void>((resolve, reject) => {
    const watching = compiler.watch({}, (err?: Error | null, _stats?: Stats) => {
      watching.close(() => (err ? reject(err) : resolve()))
    })
  })
}

function injectCount() {
  const html = readFileSync(join(outputPath, 'index.html'), 'utf8')
  return html.split(`data-id="${INJECT_SCRIPT_TAG_ID}"`).length - 1
}

const versionJsonPath = () => join(outputPath, DIRECTORY_NAME, `${JSON_FILE_NAME}.json`)

describe('webpack plugin', () => {
  it('injects into index.html and emits version.json in production mode', async () => {
    await run('production')
    expect(injectCount()).toBe(1)
    expect(existsSync(versionJsonPath())).toBe(true)
  })

  it('still runs when mode is not set, since webpack builds that as production', async () => {
    await run(undefined)
    expect(injectCount()).toBe(1)
  })

  it('does nothing in development mode', async () => {
    await run('development')
    expect(injectCount()).toBe(0)
    expect(existsSync(versionJsonPath())).toBe(false)
  })

  it('does nothing in watch mode, even with mode production', async () => {
    await watchOnce('production')
    expect(injectCount()).toBe(0)
    expect(existsSync(versionJsonPath())).toBe(false)
  })
})
