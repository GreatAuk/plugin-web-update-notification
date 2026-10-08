const assert = require('node:assert/strict')
const { mkdtempSync, readFileSync, rmSync, writeFileSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { join } = require('node:path')
const { test } = require('node:test')
const { WebUpdateNotificationPlugin } = require('../dist/index.cjs')

// Re-emit a fresh HTML asset on each compilation, as HTML plugins do.
class HtmlFixturePlugin {
  apply(compiler) {
    let build = 0
    const createHtml = () => `<html><head></head><body><!-- build ${build++} --></body></html>`
    if (compiler.webpack) {
      compiler.hooks.thisCompilation.tap('HtmlFixturePlugin', (compilation) => {
        compilation.hooks.processAssets.tap(
          {
            name: 'HtmlFixturePlugin',
            stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
          },
          () =>
            compilation.emitAsset(
              'index.html',
              new compiler.webpack.sources.RawSource(createHtml()),
            ),
        )
      })
    } else {
      compiler.hooks.emit.tap('HtmlFixturePlugin', (compilation) => {
        const html = createHtml()
        compilation.assets['index.html'] = { source: () => html, size: () => html.length }
      })
    }
  }
}

const run = (compiler) =>
  new Promise((resolve, reject) => {
    compiler.run((error, stats) => {
      if (error) reject(error)
      else if (stats.hasErrors()) reject(new Error(stats.toString({ all: false, errors: true })))
      else resolve(stats)
    })
  })

for (const major of [4, 5]) {
  for (const hiddenDefaultNotification of [false, true]) {
    test(`webpack ${major}: hiddenDefaultNotification=${hiddenDefaultNotification}, repeated compilation`, async () => {
      const webpack = require(major === 4 ? 'webpack4' : 'webpack')
      const directory = mkdtempSync(join(tmpdir(), 'web-update-webpack-'))
      const warnings = []
      const onWarning = (warning) => warnings.push(warning)
      process.on('warning', onWarning)
      writeFileSync(join(directory, 'entry.js'), 'console.log("fixture")')
      const compiler = webpack({
        mode: 'production',
        entry: join(directory, 'entry.js'),
        output: { path: join(directory, 'dist'), filename: 'main.js', publicPath: '/app/' },
        plugins: [
          new HtmlFixturePlugin(),
          new WebUpdateNotificationPlugin({
            versionType: 'custom',
            customVersion: '测试-v1',
            silence: true,
            hiddenDefaultNotification,
          }),
        ],
      })
      try {
        for (let build = 0; build < 2; build++) {
          const stats = await run(compiler)
          assert.deepEqual(stats.compilation.warnings, [])
          const output = join(directory, 'dist')
          const assets = Object.keys(stats.compilation.assets)
            .filter((name) => name.startsWith('pluginWebUpdateNotice/'))
            .map((name) => name.slice('pluginWebUpdateNotice/'.length))
          assert.equal(assets.length, hiddenDefaultNotification ? 2 : 3)
          const json = JSON.parse(
            readFileSync(
              join(output, 'pluginWebUpdateNotice', 'web_version_by_plugin.json'),
              'utf8',
            ),
          )
          assert.deepEqual(json, { version: '测试-v1', silence: true })
          const script = assets.find((name) =>
            /^webUpdateNoticeInjectScript\.iife\.[a-f0-9]{8}\.js$/.test(name),
          )
          assert.ok(script)
          assert.ok(
            readFileSync(join(output, 'pluginWebUpdateNotice', script), 'utf8').includes('测试-v1'),
          )
          const html = readFileSync(join(output, 'index.html'), 'utf8')
          assert.ok(html.includes(`src="/app/pluginWebUpdateNotice/${script}"`))
          assert.ok(html.includes('data-v="测试-v1"'))
          assert.equal((html.match(/data-id="_pwun_"/g) || []).length, 1)
          const css = assets.find((name) =>
            /^webUpdateNoticeInjectStyle\.[a-f0-9]{8}\.css$/.test(name),
          )
          assert.equal(Boolean(css), !hiddenDefaultNotification)
          if (css) assert.ok(html.includes(`href="/app/pluginWebUpdateNotice/${css}"`))
          assert.equal(html.includes('plugin-web-update-notice-anchor'), !hiddenDefaultNotification)
          if (major === 5) {
            for (const asset of stats.compilation
              .getAssets()
              .filter((item) => item.name.startsWith('pluginWebUpdateNotice/'))) {
              assert.equal(asset.source.size(), readFileSync(join(output, asset.name)).length)
            }
          }
        }
        await new Promise((resolve) => setImmediate(resolve))
        assert.deepEqual(
          warnings.filter((warning) => warning.code === 'DEP_WEBPACK_COMPILATION_ASSETS'),
          [],
        )
      } finally {
        if (compiler.close)
          await new Promise((resolve, reject) =>
            compiler.close((error) => (error ? reject(error) : resolve())),
          )
        process.off('warning', onWarning)
        rmSync(directory, { recursive: true, force: true })
      }
    })
  }
}
