import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'
import type { IApi } from 'umi'
import plugin from './index'

// The same Joi instance Umi uses to validate plugin config (see @umijs/core config.validateConfig)
const requireFromUmi = createRequire(createRequire(import.meta.url).resolve('umi'))
const Joi = requireFromUmi('@umijs/utils/compiled/@hapi/joi')

type DescribeOptions = Parameters<IApi['describe']>[0]
type SchemaFn = NonNullable<NonNullable<DescribeOptions['config']>['schema']>
type JoiSchema = { validate: (value: unknown) => { error?: unknown } }

function getSchema() {
  let schemaFn: SchemaFn | undefined
  const api = {
    env: 'development',
    userConfig: {},
    describe: (opts: DescribeOptions) => {
      schemaFn = opts.config?.schema
    },
  } as unknown as IApi
  plugin(api)
  // Umi spreads Joi into a plain object before calling schema()
  return schemaFn!({ ...Joi }) as JoiSchema
}

function validate(config: unknown) {
  return getSchema().validate(config).error
}

describe('umi plugin config schema', () => {
  it('accepts logVersion as a boolean', () => {
    expect(validate({ logVersion: true })).toBeUndefined()
    expect(validate({ logVersion: false })).toBeUndefined()
  })

  it('accepts logVersion as a function', () => {
    expect(validate({ logVersion: (_version: string) => {} })).toBeUndefined()
  })

  it('rejects logVersion of another type', () => {
    expect(validate({ logVersion: 'yes' })).toBeDefined()
  })

  it.each(['git_commit_hash', 'svn_revision_number', 'pkg_version', 'build_timestamp', 'custom'])(
    'accepts versionType %s',
    (versionType) => {
      expect(validate({ versionType })).toBeUndefined()
    },
  )

  it('rejects an unknown versionType', () => {
    expect(validate({ versionType: 'git_hash' })).toBeDefined()
  })
})
