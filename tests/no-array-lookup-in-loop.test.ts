import { RuleTester } from 'eslint'
import { describe, it } from 'vitest'
import rule from '../rules/no-array-lookup-in-loop.ts'

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
})

describe('no-array-lookup-in-loop', () => {
  describe('valid', () => {
    it('allows Set.has inside filter — O(1) lookup', () => {
      tester.run('no-array-lookup-in-loop', rule, {
        valid: [
          `const activeSet = new Set(activeIds);
           allUsers.filter(u => activeSet.has(u.id))`,
        ],
        invalid: [],
      })
    })

    it('allows Map.get inside map — O(1) lookup', () => {
      tester.run('no-array-lookup-in-loop', rule, {
        valid: [
          `const customerMap = new Map(customers.map(c => [c.id, c]));
           orders.map(order => ({ ...order, customer: customerMap.get(order.customerId) }))`,
        ],
        invalid: [],
      })
    })

    it('allows standalone find outside loop callback', () => {
      tester.run('no-array-lookup-in-loop', rule, {
        valid: [`const found = items.find(x => x.id === targetId)`],
        invalid: [],
      })
    })

    it('allows includes on non-iteration context', () => {
      tester.run('no-array-lookup-in-loop', rule, {
        valid: [`const ok = ['a','b'].includes(someValue)`],
        invalid: [],
      })
    })
  })

  describe('invalid', () => {
    it('reports includes inside filter — O(n²) lookup', () => {
      tester.run('no-array-lookup-in-loop', rule, {
        valid: [],
        invalid: [
          {
            code: `allUsers.filter(u => activeIds.includes(u.id))`,
            errors: [{ messageId: 'arrayLookupInLoop' }],
          },
        ],
      })
    })

    it('reports findIndex inside filter — quadratic dedup pattern', () => {
      tester.run('no-array-lookup-in-loop', rule, {
        valid: [],
        invalid: [
          {
            code: `items.filter((item, i) => items.findIndex(x => x.id === item.id) === i)`,
            errors: [{ messageId: 'arrayLookupInLoop' }],
          },
        ],
      })
    })

    it('reports find inside map — O(n²) join pattern', () => {
      tester.run('no-array-lookup-in-loop', rule, {
        valid: [],
        invalid: [
          {
            code: `orders.map(order => ({ ...order, customer: customers.find(c => c.id === order.customerId) }))`,
            errors: [{ messageId: 'arrayLookupInLoop' }],
          },
        ],
      })
    })

    it('reports find inside forEach', () => {
      tester.run('no-array-lookup-in-loop', rule, {
        valid: [],
        invalid: [
          {
            code: `users.forEach(u => { const p = permissions.find(p => p.userId === u.id); })`,
            errors: [{ messageId: 'arrayLookupInLoop' }],
          },
        ],
      })
    })

    it('reports indexOf inside reduce', () => {
      tester.run('no-array-lookup-in-loop', rule, {
        valid: [],
        invalid: [
          {
            code: `arr.reduce((acc, x) => { arr.indexOf(x); return acc; }, [])`,
            errors: [{ messageId: 'arrayLookupInLoop' }],
          },
        ],
      })
    })
  })
})
