import { RuleTester } from 'eslint'
import { describe, it } from 'vitest'
import rule from '../rules/no-quadratic-dedup.ts'

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
})

describe('no-quadratic-dedup', () => {
  describe('valid', () => {
    it('allows Set-based dedup — O(n)', () => {
      tester.run('no-quadratic-dedup', rule, {
        valid: [
          `const seen = new Set();
           const unique = items.filter(item => { if (seen.has(item.id)) return false; seen.add(item.id); return true; })`,
        ],
        invalid: [],
      })
    })

    it('allows Map-based dedup — O(n)', () => {
      tester.run('no-quadratic-dedup', rule, {
        valid: [`const unique = [...new Map(items.map(i => [i.id, i])).values()]`],
        invalid: [],
      })
    })
  })

  describe('invalid', () => {
    it('reports filter+findIndex dedup on object identity — O(n²)', () => {
      tester.run('no-quadratic-dedup', rule, {
        valid: [],
        invalid: [
          {
            code: `const unique = items.filter((item, i) => items.findIndex(x => x.id === item.id) === i)`,
            errors: [{ messageId: 'quadraticDedup' }],
          },
        ],
      })
    })

    it('reports filter+findIndex dedup on primitive equality — O(n²)', () => {
      tester.run('no-quadratic-dedup', rule, {
        valid: [],
        invalid: [
          {
            code: `const unique = arr.filter((el, idx) => arr.findIndex(e => e === el) === idx)`,
            errors: [{ messageId: 'quadraticDedup' }],
          },
        ],
      })
    })
  })
})
