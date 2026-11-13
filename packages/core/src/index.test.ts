import { execSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createContext, runInContext } from 'node:vm'
import { findUpSync } from 'find-up'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  generateJSONFileContent,
  generateJsFileContent,
  getFileHash,
  getHostProjectPkgVersion,
  getVersion,
  logVersionDefault,
} from './index'

vi.mock('node:child_process', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:child_process')>()),
  execSync: vi.fn(),
}))

// keep the real implementation by default (getHostProjectPkgVersion relies on it),
// individual cases override it to fake the repository type
const actualFindUp = await vi.importActual<typeof import('find-up')>('find-up')
vi.mock('find-up', async (importOriginal) => {
  const actual = await importOriginal<typeof import('find-up')>()
  return { ...actual, findUpSync: vi.fn(actual.findUpSync) }
})

const mockedExecSync = vi.mocked(execSync)
const mockedFindUpSync = vi.mocked(findUpSync)

/** fake the repository type detected by `findUpSync('.git' | '.svn')` */
function mockRepo(type: 'Git' | 'SVN' | 'unknown') {
  const marker = { Git: '.git', SVN: '.svn', unknown: '' }[type]
  mockedFindUpSync.mockImplementation(((name: string) =>
    name === marker ? `/repo/${name}` : undefined) as typeof findUpSync)
}

const NOW = new Date('2026-01-02T03:04:05.000Z').getTime()
const originalPkgVersion = process.env.npm_package_version

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  mockedExecSync.mockReset()
  mockedFindUpSync.mockImplementation(actualFindUp.findUpSync)
  if (originalPkgVersion === undefined) delete process.env.npm_package_version
  else process.env.npm_package_version = originalPkgVersion
})

describe('getHostProjectPkgVersion', () => {
  let tmp: string

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'pwun-'))
    delete process.env.npm_package_version
  })

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true })
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

describe('getVersion', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
  })

  describe('explicit versionType', () => {
    it('git_commit_hash: trims the output of `git rev-parse --short HEAD`', () => {
      mockedExecSync.mockReturnValue(Buffer.from('a1b2c3d\n'))
      expect(getVersion('git_commit_hash')).toBe('a1b2c3d')
      expect(mockedExecSync).toHaveBeenCalledWith('git rev-parse --short HEAD')
    })

    it('svn_revision_number: trims the output of `svnversion`', () => {
      mockedExecSync.mockReturnValue(Buffer.from(' 1024\n'))
      expect(getVersion('svn_revision_number')).toBe('1024')
      expect(mockedExecSync).toHaveBeenCalledWith('svnversion')
    })

    it('pkg_version: reads npm_package_version', () => {
      process.env.npm_package_version = ' 3.4.5 '
      expect(getVersion('pkg_version')).toBe('3.4.5')
      expect(mockedExecSync).not.toHaveBeenCalled()
    })

    it('build_timestamp: returns Date.now() as a string', () => {
      expect(getVersion('build_timestamp')).toBe(`${NOW}`)
    })

    it('custom: returns the customVersion', () => {
      expect(getVersion('custom', 'release-42')).toBe('release-42')
    })
  })

  describe('falls back to build timestamp', () => {
    it('when the git command fails', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('fatal: not a git repository')
      })
      expect(getVersion('git_commit_hash')).toBe(`${NOW}`)
      expect(console.error).toHaveBeenCalledWith(expect.any(Error))
    })

    it('when the svn command fails', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('svnversion: command not found')
      })
      expect(getVersion('svn_revision_number')).toBe(`${NOW}`)
    })

    it('when versionType is custom but customVersion is empty', () => {
      // @ts-expect-error -- runtime guard for JS users / missing option
      expect(getVersion('custom')).toBe(`${NOW}`)
      expect(getVersion('custom', '')).toBe(`${NOW}`)
    })

    it('when versionType is not supported, and names it in the warning', () => {
      // @ts-expect-error -- unsupported value on purpose
      expect(getVersion('foo')).toBe(`${NOW}`)
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(`'foo' is not supported`))
    })
  })

  describe('default versionType by repository type', () => {
    it('Git repository -> git commit hash', () => {
      mockRepo('Git')
      mockedExecSync.mockReturnValue(Buffer.from('deadbee\n'))
      expect(getVersion()).toBe('deadbee')
      expect(mockedExecSync).toHaveBeenCalledWith('git rev-parse --short HEAD')
    })

    it('SVN repository -> svn revision number', () => {
      mockRepo('SVN')
      mockedExecSync.mockReturnValue(Buffer.from('77\n'))
      expect(getVersion()).toBe('77')
      expect(mockedExecSync).toHaveBeenCalledWith('svnversion')
    })

    it('unknown repository -> build timestamp without warnings', () => {
      mockRepo('unknown')
      expect(getVersion()).toBe(`${NOW}`)
      expect(mockedExecSync).not.toHaveBeenCalled()
      expect(console.warn).not.toHaveBeenCalled()
    })

    it('git worktree / submodule (`.git` is a file) -> git commit hash', () => {
      const tmp = mkdtempSync(join(tmpdir(), 'pwun-'))
      try {
        writeFileSync(join(tmp, '.git'), 'gitdir: /somewhere/.git/worktrees/x\n')
        const sub = join(tmp, 'src')
        mkdirSync(sub)
        vi.spyOn(process, 'cwd').mockReturnValue(sub)
        mockedExecSync.mockReturnValue(Buffer.from('cafe123\n'))
        expect(getVersion()).toBe('cafe123')
        expect(mockedExecSync).toHaveBeenCalledWith('git rev-parse --short HEAD')
      } finally {
        rmSync(tmp, { recursive: true, force: true })
      }
    })

    it('explicit versionType wins over the detected repository type', () => {
      mockRepo('Git')
      expect(getVersion('build_timestamp')).toBe(`${NOW}`)
      expect(mockedExecSync).not.toHaveBeenCalled()
    })
  })
})

describe('generateJSONFileContent', () => {
  it('contains only the version by default', () => {
    const content = generateJSONFileContent('v1.0.0')
    expect(JSON.parse(content)).toEqual({ version: 'v1.0.0' })
  })

  it('omits silence when it is false', () => {
    expect(JSON.parse(generateJSONFileContent('v1', false))).not.toHaveProperty('silence')
  })

  it('adds silence: true when silence is enabled', () => {
    expect(JSON.parse(generateJSONFileContent('v1', true))).toEqual({
      version: 'v1',
      silence: true,
    })
  })

  it('is pretty printed with 2 spaces', () => {
    expect(generateJSONFileContent('v1', true)).toBe('{\n  "version": "v1",\n  "silence": true\n}')
  })
})

/** custom logger: inlined via toString(), so it may only touch globals */
function logVersion(version: string, time?: number) {
  ;(globalThis as Record<string, unknown>).__pwunLogged__ = [version, time]
}

describe('generateJsFileContent', () => {
  const fileSource = '/* inject script source */'

  /** evaluate the generated script with a fake `window` */
  function run(content: string) {
    const win = { __checkUpdateSetup__: vi.fn() }
    // oxlint-disable-next-line no-new-func
    new Function('window', content)(win)
    return win
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
  })

  it('appends the setup call with serialized options after the source', () => {
    const options = { checkInterval: 1000, locale: 'en_US', logVersion: false }
    const content = generateJsFileContent(fileSource, 'v1', options)

    expect(content.startsWith(fileSource)).toBe(true)
    expect(content).toContain(`window.__checkUpdateSetup__(${JSON.stringify(options)});`)
    expect(run(content).__checkUpdateSetup__).toHaveBeenCalledWith(options)
  })

  it('logs version with the default logger when logVersion is not set', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const content = generateJsFileContent(fileSource, 'abc1234', {})

    expect(content).toContain(`logFn("abc1234", ${NOW})`)
    run(content)
    expect(log).toHaveBeenCalledWith('version: %cabc1234', 'color: #1677ff')
    expect(log).toHaveBeenCalledWith(
      `release time: %c${new Date(NOW).toLocaleString()}`,
      'color: #1677ff',
    )
  })

  it('uses the default logger source for logVersion: true', () => {
    const content = generateJsFileContent(fileSource, 'v1', { logVersion: true })
    expect(content).toContain(logVersionDefault.toString())
  })

  it('does not leak bindings into the global lexical scope of a classic script', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const context = createContext({ console })
    context.window = context
    context.__checkUpdateSetup__ = vi.fn()
    // a host page script that happens to declare the same top-level name
    runInContext('const logFn = "host"', context)

    const content = generateJsFileContent(fileSource, 'v3', {})
    expect(() => runInContext(content, context)).not.toThrow()
    expect(context.__checkUpdateSetup__).toHaveBeenCalledWith({})
    expect(log).toHaveBeenCalledWith('version: %cv3', 'color: #1677ff')
    expect(runInContext('logFn', context)).toBe('host')
  })

  it('escapes quotes and backslashes in the version so the script stays valid', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const version = `it's "v1"\\n</script>`
    const content = generateJsFileContent(fileSource, version, {})

    expect(() => run(content)).not.toThrow()
    expect(log).toHaveBeenCalledWith(`version: %c${version}`, 'color: #1677ff')
  })

  it('does not log when logVersion is false', () => {
    const content = generateJsFileContent(fileSource, 'v1', { logVersion: false })
    expect(content).not.toContain('logFn')
  })

  it('inlines a custom logVersion function and calls it with version and release time', () => {
    const content = generateJsFileContent(fileSource, 'v2', { logVersion })

    expect(content).toContain(logVersion.toString())
    expect(content).not.toContain(logVersionDefault.toString())
    run(content)
    expect((globalThis as Record<string, unknown>).__pwunLogged__).toEqual(['v2', NOW])
    delete (globalThis as Record<string, unknown>).__pwunLogged__
  })
})

describe('getFileHash', () => {
  it('returns the first 8 hex chars of the md5 digest', () => {
    expect(getFileHash('')).toBe('d41d8cd9')
    expect(getFileHash('abc')).toBe('90015098')
  })

  it('is deterministic and content sensitive', () => {
    const content = 'console.log("hello")'
    expect(getFileHash(content)).toBe(getFileHash(content))
    expect(getFileHash(content)).not.toBe(getFileHash(`${content};`))
    expect(getFileHash(content)).toMatch(/^[0-9a-f]{8}$/)
  })
})
