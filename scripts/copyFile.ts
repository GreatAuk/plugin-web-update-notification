import { copyFileSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

// relative to repository root
const files = ['LICENSE', 'README.md', 'README.zh-CN.md']
const packages = ['core', 'vite-plugin', 'umi-plugin', 'webpack-plugin', 'rspack-plugin', 'nuxt']

const _filename = import.meta.url ? fileURLToPath(import.meta.url) : __filename
const root = resolve(_filename, '../..')

packages.forEach((pkg) => {
  files.forEach((file) => {
    copyFileSync(resolve(root, file), resolve(root, 'packages', pkg, file))
  })
})
