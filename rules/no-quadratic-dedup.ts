import type { Rule } from 'eslint'
import type { Node, CallExpression } from 'estree'

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    schema: [],
    messages: {
      quadraticDedup: 'O(n²): arr.filter((item, i) => arr.findIndex(...) === i) is quadratic. Use a Map or Set for O(n) dedup.',
    },
  },
  create(context) {
    return {
      'CallExpression[callee.property.name="filter"]'(node: CallExpression) {
        const callback = node.arguments[0]
        if (!callback) return

        const params = 'params' in callback ? callback.params : []
        if (!params || params.length < 2) return

        const indexParam = params[1]
        if (!indexParam || indexParam.type !== 'Identifier') return
        const indexName = indexParam.name

        const body = ('body' in callback ? callback.body : null) as Node | null
        findInNode(body, (n) => {
          if (
            n.type === 'BinaryExpression' &&
            n.operator === '===' &&
            (
              (isFindIndexCall(n.left) && isIdent(n.right, indexName)) ||
              (isFindIndexCall(n.right) && isIdent(n.left, indexName))
            )
          ) {
            context.report({ node, messageId: 'quadraticDedup' })
            return true
          }
          return false
        })
      },
    }
  },
}

export default rule

function isFindIndexCall(node: Node): boolean {
  return (
    node.type === 'CallExpression' &&
    node.callee.type === 'MemberExpression' &&
    node.callee.property.type === 'Identifier' &&
    node.callee.property.name === 'findIndex'
  )
}

function isIdent(node: Node, name: string): boolean {
  return node.type === 'Identifier' && node.name === name
}

function findInNode(node: Node | null | undefined, visitor: (n: Node) => boolean): boolean {
  if (!node || typeof node !== 'object') return false
  if (Array.isArray(node)) {
    for (const child of node as Node[]) {
      if (findInNode(child, visitor)) return true
    }
    return false
  }
  if (!('type' in node)) return false
  if (visitor(node)) return true
  for (const key of Object.keys(node)) {
    if (key === 'parent') continue
    const child = (node as unknown as Record<string, unknown>)[key]
    if (child && typeof child === 'object') {
      if (findInNode(child as Node, visitor)) return true
    }
  }
  return false
}
