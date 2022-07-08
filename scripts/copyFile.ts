import { copyFileSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

// relative to scripts directory
const destinations = [
  ['../LICENSE', '../packages/core/LICENSE'],
  ['../README.md', '../packages/core/README.md'],
  ['../LICENSE', '../packages/vite-plugin/LICENSE'],
  ['../README.md', '../packages/vite-plugin/README.md'],
  ['../LICENSE', '../packages/umi-plugin/LICENSE'],
  ['../README.md', '../packages/umi-plugin/README.md'],
]

const _filename = import.meta.url ? fileURLToPath(import.meta.url) : __filename

destinations.forEach(([src, dest]) => {
  copyFileSync(resolve(_filename, '..', src), resolve(_filename, '..', dest))
})
