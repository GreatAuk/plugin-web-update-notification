import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { findUpSync } from 'find-up'

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
 * It checks if a path is a Git or SVN repository
 * @param {string} path - The path to the repository.
 * @returns A string that is either 'Git', 'SVN', or undefined.
 */
function checkRepoType() {
  const gitRepo = findUpSync('.git', { type: 'directory' })
  if (gitRepo)
    return 'Git'
  const svnRepo = findUpSync('.svn', { type: 'directory' })
  if (svnRepo)
    return 'SVN'

  return 'unknown'
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
 * get SVN revision number
 * @returns The SVN revision number.
 */
export function getSVNRevisionNumber() {
  try {
    return execSync('svnversion').toString().replace('\n', '').trim()
  }
  catch (err) {
    console.warn(`
======================================================
[plugin-web-update-notice] Not a SVN repository!
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

export function getCustomVersion(version?: string) {
  if (!version) {
    console.warn(`
======================================================
[plugin-web-update-notice] The versionType is 'custom', but the customVersion is not specified!
======================================================`)
    throw new Error('The versionType is \'custom\', but the customVersion is not specified!')
  }
  return version
}

/**
 * It returns the version of the current project.
 * @param {VersionType} [versionType=git_commit_hash] - The version type
 * @param {string} [customVersion] - The custom version
 * @returns The version by the plugin.
 */
export function getVersion(): string
export function getVersion(versionType: 'custom', customVersion: string): string
export function getVersion(versionType: Exclude<VersionType, 'custom'>): string
export function getVersion(versionType?: VersionType, customVersion?: string) {
  const getVersionStrategies: Record<VersionType, () => string> = {
    pkg_version: getHostProjectPkgVersion,
    git_commit_hash: getGitCommitHash,
    build_timestamp: getTimestamp,
    custom: () => getCustomVersion(customVersion),
    svn_revision_number: getSVNRevisionNumber,
  }

  const defaultStrategyMap = {
    Git: 'git_commit_hash',
    SVN: 'svn_revision_number',
    unknown: '',
  }

  const versionType_ = (versionType || defaultStrategyMap[checkRepoType()]) as VersionType

  try {
    const strategy = getVersionStrategies[versionType_]
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
