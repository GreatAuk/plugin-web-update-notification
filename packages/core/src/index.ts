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

/**
 * If the current directory is a git repository, return the current commit hash, otherwise return the
 * current time
 * @returns The git commit hash or the current time.
 */
export function getVersion() {
  try {
    return execSync('git rev-parse --short HEAD').toString().replace('\n', '')
  }
  catch (err) {
    console.warn(`
======================================================
[plugin-web-update-notice] Not a git repository!, we will use the packaging time instead.
======================================================`)
    return `${Date.now()}`
  }
}

/**
 * generate json file content for version
 * @param {string} version - git commit hash or packaging time
 * @returns A string
 */
export function generateJSONFileContent(version: string) {
  return `
{
  "version": "${version}"
}`.replace('\n', '')
}

