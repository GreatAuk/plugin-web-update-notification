import { defineConfig } from 'tsup'
import { INJECT_SCRIPT_FILE_NAME } from './src/constant'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default defineConfig((options) => { // The options here is derived from CLI flags.
  return {
    entry: {
      index: 'src/index.ts',
      [INJECT_SCRIPT_FILE_NAME]: 'src/script.ts',
    },
    splitting: false,
    sourcemap: true,
    clean: true,
    dts: true,
    format: ['cjs', 'esm'],
    onSuccess: 'cp -a public/. dist',
  }
})
