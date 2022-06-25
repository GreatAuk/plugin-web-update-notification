import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import { name as pkgName_ } from '../package.json'

export * from './constant'
export type { Options } from './type'
export const pkgName = pkgName_

/**
 * It returns the directory name of the current file.
 * @returns __dirname
 */
export function get__Dirname() {
  if (import.meta?.url)
    return dirname(fileURLToPath(import.meta.url))
  return __dirname
}

/** A function that returns the hash of the current commit. */
export function getGitCommitHash() {
  try {
    return execSync('git rev-parse --short HEAD').toString().replace('\n', '')
  }
  catch (err) {
    console.warn(`
======================================================
[vite-plugin-web-update-notice] Not a git repository !
======================================================
    `)
    return ''
  }
}

/**
 * generate json file content for git commit hash
 * @param {string} hash - git commit hash
 * @returns A string
 */
export function generateJSONFileContent(hash: string) {
  return `
{
  "hash": "${hash}"
}`.replace('\n', '')
}

