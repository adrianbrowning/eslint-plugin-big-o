import type { Rule } from 'eslint'
import type { Node } from 'estree'

const LOOP_METHODS = new Set(['map', 'filter', 'reduce', 'forEach', 'flatMap', 'some', 'every'])
const LOOKUP_METHODS = new Set(['find', 'findIndex', 'includes', 'indexOf'])

type NodeWithParent = Node & { parent?: NodeWithParent }

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    schema: [],
    messages: {
      arrayLookupInLoop: 'O(n²): .{{method}}() inside .{{outer}}() callback. Use a Map or Set for O(1) lookup.',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type !== 'MemberExpression' ||
          node.callee.property.type !== 'Identifier' ||
          !LOOKUP_METHODS.has(node.callee.property.name)
        ) return

        const method = node.callee.property.name

        const ancestors = context.sourceCode.getAncestors(node)
        for (let i = ancestors.length - 1; i >= 0; i--) {
          const ancestor = ancestors[i]
          if (!ancestor) continue
          if (
            ancestor.type === 'CallExpression' &&
            ancestor.callee.type === 'MemberExpression' &&
            ancestor.callee.property.type === 'Identifier' &&
            LOOP_METHODS.has(ancestor.callee.property.name)
          ) {
            const loopMethod = ancestor.callee.property.name
            const callback = ancestor.arguments[0] as NodeWithParent | undefined
            if (callback && isDescendant(node as NodeWithParent, callback)) {
              context.report({
                node,
                messageId: 'arrayLookupInLoop',
                data: { method, outer: loopMethod },
              })
              return
            }
          }
        }
      },
    }
  },
}

export default rule

function isDescendant(node: NodeWithParent, ancestor: NodeWithParent): boolean {
  let current: NodeWithParent | undefined = node
  while (current) {
    if (current === ancestor) return true
    current = current.parent
  }
  return false
}
