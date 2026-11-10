import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getHostProjectPkgVersion, getVersion } from './index'

describe('getHostProjectPkgVersion', () => {
  let tmp: string
  const originalEnv = process.env.npm_package_version

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'pwun-'))
    delete process.env.npm_package_version
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true })
    if (originalEnv === undefined) delete process.env.npm_package_version
    else process.env.npm_package_version = originalEnv
    vi.restoreAllMocks()
  })

  it('prefers npm_package_version when set', () => {
    process.env.npm_package_version = '9.9.9'
    expect(getHostProjectPkgVersion()).toBe('9.9.9')
  })

  it('falls back to the nearest package.json when env is missing', () => {
    writeFileSync(join(tmp, 'package.json'), JSON.stringify({ version: '1.2.3' }))
    const sub = join(tmp, 'src')
    mkdirSync(sub)
    vi.spyOn(process, 'cwd').mockReturnValue(sub)
    expect(getHostProjectPkgVersion()).toBe('1.2.3')
  })

  it('throws when package.json has no version, so getVersion falls back to timestamp', () => {
    writeFileSync(join(tmp, 'package.json'), JSON.stringify({ name: 'x' }))
    vi.spyOn(process, 'cwd').mockReturnValue(tmp)
    expect(() => getHostProjectPkgVersion()).toThrow()
    expect(getVersion('pkg_version')).toMatch(/^\d{13}$/)
  })
})
