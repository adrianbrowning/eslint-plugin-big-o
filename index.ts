import type { Rule } from 'eslint'
import noArrayLookupInLoop from './rules/no-array-lookup-in-loop.ts'
import noQuadraticDedup from './rules/no-quadratic-dedup.ts'
import noNestedArraySpread from './rules/no-nested-array-spread.ts'

type Plugin = {
  meta: { name: string }
  rules: Record<string, Rule.RuleModule>
  configs: Record<string, unknown>
}

const plugin: Plugin = {
  meta: {
    name: 'eslint-plugin-big-o',
  },
  rules: {
    'no-array-lookup-in-loop': noArrayLookupInLoop,
    'no-quadratic-dedup': noQuadraticDedup,
    'no-nested-array-spread': noNestedArraySpread,
  },
  configs: {},
}

plugin.configs = {
  recommended: {
    plugins: { 'big-o': plugin },
    rules: {
      'big-o/no-array-lookup-in-loop': 'warn',
      'big-o/no-quadratic-dedup': 'warn',
      'big-o/no-nested-array-spread': 'warn',
    },
  },
}

export default plugin
