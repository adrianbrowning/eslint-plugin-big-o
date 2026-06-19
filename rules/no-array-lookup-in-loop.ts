import { ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";
import ts from "typescript";

const LOOP_METHODS = new Set([ "map", "filter", "reduce", "forEach", "flatMap", "some", "every" ]);
const LOOKUP_METHODS = new Set([ "find", "findIndex", "includes", "indexOf" ]);

type NodeWithParent = TSESTree.Node & { parent?: NodeWithParent; };

const createRule = ESLintUtils.RuleCreator(name => `https://github.com/adrianbrowning/eslint-plugin-big-o/blob/main/docs/rules/${name}.md`);

const rule = createRule({
  name: "no-array-lookup-in-loop",
  meta: {
    type: "suggestion",
    schema: [],
    messages: {
      arrayLookupInLoop: "O(n²): .{{method}}() inside .{{outer}}() callback. Use a Map or Set for O(1) lookup.",
    },
    docs: {
      description: "Disallow O(n²) array lookups inside loop callbacks",
    },
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context, true);
    const checker = services.program?.getTypeChecker();

    return {
      CallExpression(node) {
        if (
          node.callee.type !== "MemberExpression" ||
          node.callee.property.type !== "Identifier" ||
          !LOOKUP_METHODS.has(node.callee.property.name)
        ) return;

        const method = node.callee.property.name;

        // Skip string.includes — substring search, not O(n²) array scan
        if (checker && method === "includes") {
          const tsNode = services.esTreeNodeToTSNodeMap.get(node.callee.object);
          if (checker.getTypeAtLocation(tsNode).flags & ts.TypeFlags.StringLike) {
            return;
          }
        }

        const loopMethod = findEnclosingLoopMethod(context.sourceCode.getAncestors(node), node);
        if (loopMethod) {
          context.report({
            node,
            messageId: "arrayLookupInLoop",
            data: { method, outer: loopMethod },
          });
        }
      },
    };
  },
});

export default rule;

function findEnclosingLoopMethod(ancestors: Array<NodeWithParent>, node: NodeWithParent): string | null {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const ancestor = ancestors[i];
    if (!ancestor || ancestor.type !== "CallExpression") continue;
    const { callee } = ancestor;
    if (
      callee.type === "MemberExpression" &&
      callee.property.type === "Identifier" &&
      LOOP_METHODS.has(callee.property.name)
    ) {
      const loopMethod = callee.property.name;
      const callback = ancestor.arguments[0] as NodeWithParent | undefined;
      if (callback && isDescendant(node, callback)) return loopMethod;
    }
  }
  return null;
}

function isDescendant(node: NodeWithParent, ancestor: NodeWithParent): boolean {
  let current: NodeWithParent | undefined = node;
  while (current) {
    if (current === ancestor) return true;
    current = current.parent;
  }
  return false;
}
