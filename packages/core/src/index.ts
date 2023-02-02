import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import './shim.d.ts'

import { name as pkgName_ } from '../package.json'
import type { VersionType } from './type'
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
 * It returns the version of the host project's package.json file
 * @returns The version of the package.json file in the root of the project.
 */
export function getHostProjectPkgVersion() {
  try {
    return process.env.npm_package_version as string
  }
  catch (err) {
    console.warn(`
======================================================
[plugin-web-update-notice] cannot get the version of the host project's package.json file!
======================================================`)
    throw err
  }
}

/**
 * If the current directory is a git repository, return the current commit hash
 * @returns The git commit hash of the current branch.
 */
export function getGitCommitHash() {
  try {
    return execSync('git rev-parse --short HEAD').toString().replace('\n', '').trim()
  }
  catch (err) {
    console.warn(`
======================================================
[plugin-web-update-notice] Not a git repository!
======================================================`)
    throw err
  }
}

/**
 * It returns the current timestamp
 * @returns The current time in milliseconds.
 */
export function getTimestamp() {
  return `${Date.now()}`
}

/**
 * It returns the version of the current project.
 * @param {VersionType} [versionType=git_commit_hash] - The version type
 * @returns The version of the plugin.
 */
export function getVersion(versionType: VersionType = 'git_commit_hash') {
  const getVersionStrategies: Record<VersionType, () => string> = {
    pkg_version: getHostProjectPkgVersion,
    git_commit_hash: getGitCommitHash,
    build_timestamp: getTimestamp,
  }
  try {
    const strategy = getVersionStrategies[versionType]
    if (!strategy) {
      console.warn(`
      ======================================================
      [plugin-web-update-notice] The version type '${versionType}' is not supported!, we will use the packaging timestamp instead.
      ======================================================`)
      return getTimestamp()
    }

    return strategy()
  }
  catch (err) {
    console.warn(`
======================================================
[plugin-web-update-notice] get version throw a error, we will use the packaging timestamp instead.
======================================================`)
    console.error(err)
    return getTimestamp()
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

