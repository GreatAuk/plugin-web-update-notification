import { execFile, spawn } from 'node:child_process'
import { rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
import { test as base } from '@playwright/test'
import sirv from 'sirv'
import type { Target } from './targets'

const ROOT = fileURLToPath(new URL('..', import.meta.url))

export interface TargetOptions {
  target: Target
}

export const test = base.extend<{}, TargetOptions & { serverURL: string }>({
  target: [undefined as unknown as Target, { option: true, scope: 'worker' }],

  // 每个 worker 只服务一个 project（即一个 target）：构建一次，托管到测试结束
  serverURL: [
    async ({ target }, use) => {
      const cwd = resolve(ROOT, target.dir)
      const outDir = resolve(cwd, target.outDir)

      await rm(outDir, { recursive: true, force: true })
      try {
        await promisify(execFile)('pnpm', ['run', target.build.script], {
          cwd,
          env: { ...process.env, ...target.build.env },
          maxBuffer: 64 * 1024 * 1024,
        })
      } catch (err) {
        const { stdout, stderr } = err as { stdout?: string; stderr?: string }
        throw new Error(`[${target.name}] 构建失败\n${stdout ?? ''}\n${stderr ?? ''}`, {
          cause: err,
        })
      }

      if (target.serve.type === 'static') {
        const handler = sirv(resolve(outDir, target.serve.root ?? '.'), { dev: true, single: true })
        const server = createServer((req, res) => handler(req, res))
        await new Promise<void>((done) => server.listen(0, '127.0.0.1', done))
        const { port } = server.address() as AddressInfo
        await use(`http://127.0.0.1:${port}`)
        await new Promise((done) => server.close(done))
        return
      }

      // 先占一个空闲端口再释放，交给 node 服务使用
      const probe = createServer()
      await new Promise<void>((done) => probe.listen(0, '127.0.0.1', done))
      const { port } = probe.address() as AddressInfo
      await new Promise((done) => probe.close(done))

      const url = `http://127.0.0.1:${port}`
      const child = spawn(process.execPath, [resolve(outDir, target.serve.entry)], {
        cwd,
        env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' },
        stdio: ['ignore', 'ignore', 'inherit'],
      })
      const deadline = Date.now() + 30_000
      while (
        !(await fetch(url).then(
          (r) => r.ok,
          () => false,
        ))
      ) {
        if (child.exitCode !== null) throw new Error(`[${target.name}] 服务进程已退出`)
        if (Date.now() > deadline) throw new Error(`[${target.name}] 服务启动超时：${url}`)
        await new Promise((r) => setTimeout(r, 200))
      }
      await use(url)
      child.kill()
    },
    { scope: 'worker', timeout: 5 * 60_000 },
  ],

  baseURL: async ({ serverURL }, use) => {
    await use(serverURL)
  },
})

export { expect } from '@playwright/test'
