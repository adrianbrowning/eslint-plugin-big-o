import { RuleTester } from 'eslint'
import { describe, it } from 'vitest'
import rule from '../rules/no-nested-array-spread.ts'

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
})

describe('no-nested-array-spread', () => {
  describe('valid', () => {
    it('allows accumulator-based flatten — O(n)', () => {
      tester.run('no-nested-array-spread', rule, {
        valid: [
          `function flatten(nodes, result = []) {
             for (const node of nodes) {
               result.push(node);
               if (node.children) flatten(node.children, result);
             }
             return result;
           }`,
        ],
        invalid: [],
      })
    })
  })

  describe('invalid', () => {
    it('reports spread of recursive call inside reduce — O(n²)', () => {
      tester.run('no-nested-array-spread', rule, {
        valid: [],
        invalid: [
          {
            code: `function flatten(nodes) {
              return nodes.reduce((flat, node) => {
                flat.push(node);
                if (node.children) flat.push(...flatten(node.children));
                return flat;
              }, []);
            }`,
            errors: [{ messageId: 'nestedArraySpread' }],
          },
        ],
      })
    })

    it('reports spread accumulator pattern inside reduce — O(n²)', () => {
      tester.run('no-nested-array-spread', rule, {
        valid: [],
        invalid: [
          {
            code: `function flatten(nodes) {
              return nodes.reduce((acc, node) => [...acc, node, ...flatten(node.children || [])], []);
            }`,
            errors: [{ messageId: 'nestedArraySpread' }],
          },
        ],
      })
    })
  })
})
