import type { Rule } from 'eslint'
import type { CallExpression } from 'estree'

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    schema: [],
    messages: {
      nestedArraySpread: 'O(n²): spreading a recursive call result inside reduce creates quadratic copies. Pass accumulator by reference instead.',
    },
  },
  create(context) {
    return {
      SpreadElement(node) {
        if (node.argument.type !== 'CallExpression') return

        const call = node.argument as CallExpression
        const calleeName = getCalleeName(call)
        if (!calleeName) return

        if (!isInsideReduceCallback(node)) return

        if (isRecursiveCall(node, calleeName)) {
          context.report({ node, messageId: 'nestedArraySpread' })
        }
      },
    }
  },
}

export default rule

function getCalleeName(call: CallExpression): string | null {
  if (call.callee.type === 'Identifier') return call.callee.name
  return null
}

function isInsideReduceCallback(node: Rule.Node): boolean {
  let current: Rule.Node | null = node.parent
  while (current) {
    if (
      current.type === 'CallExpression' &&
      current.callee.type === 'MemberExpression' &&
      current.callee.property.type === 'Identifier' &&
      current.callee.property.name === 'reduce'
    ) {
      const callback = current.arguments[0] as Rule.Node | undefined
      if (callback && isAncestor(callback, node)) return true
    }
    current = current.parent
  }
  return false
}

function isAncestor(ancestor: Rule.Node, node: Rule.Node): boolean {
  let current: Rule.Node | null = node
  while (current) {
    if (current === ancestor) return true
    current = current.parent
  }
  return false
}

function isRecursiveCall(node: Rule.Node, calleeName: string): boolean {
  let current: Rule.Node | null = node.parent
  while (current) {
    if (
      (current.type === 'FunctionDeclaration' || current.type === 'FunctionExpression') &&
      current.id?.name === calleeName
    ) {
      return true
    }
    // arrow function: const name = (...) => ...
    if (
      current.type === 'ArrowFunctionExpression' &&
      current.parent?.type === 'VariableDeclarator' &&
      current.parent.id?.type === 'Identifier' &&
      current.parent.id.name === calleeName
    ) {
      return true
    }
    current = current.parent
  }
  return false
}
