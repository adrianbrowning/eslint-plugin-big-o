import { ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(name => `https://github.com/adrianbrowning/eslint-plugin-big-o/blob/main/docs/rules/${name}.md`);

const rule = createRule({
  name: "no-quadratic-dedup",
  meta: {
    type: "suggestion",
    schema: [],
    messages: {
      quadraticDedup: "O(n²): arr.filter((item, i) => arr.findIndex(...) === i) is quadratic. Use a Map or Set for O(n) dedup.",
    },
    docs: {
      description: "Disallow O(n²) deduplication patterns using filter + findIndex",
    },
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context, true);
    const checker = services.program?.getTypeChecker();

    return {
      "CallExpression[callee.property.name='filter']"(node: TSESTree.CallExpression) {
        // Confirm receiver is an array type
        if (checker) {
          const callee = node.callee as TSESTree.MemberExpression;
          const tsNode = services.esTreeNodeToTSNodeMap.get(callee.object);
          const type = checker.getTypeAtLocation(tsNode);
          if (!checker.isArrayType(type) && !checker.isTupleType(type)) return;
        }

        const callback = node.arguments[0];
        if (!callback) return;

        const params = "params" in callback ? callback.params : [];
        if (params.length < 2) return;

        const indexParam = params[1];
        if (!indexParam || indexParam.type !== "Identifier") return;
        const indexName = indexParam.name;

        const body = ("body" in callback ? callback.body : null) as TSESTree.Node | null;
        findInNode(body, n => {
          if (
            n.type === "BinaryExpression" &&
            n.operator === "===" &&
            (
              (isFindIndexCall(n.left) && isIdent(n.right, indexName)) ||
              (isFindIndexCall(n.right) && isIdent(n.left, indexName))
            )
          ) {
            context.report({ node, messageId: "quadraticDedup" });
            return true;
          }
          return false;
        });
      },
    };
  },
});

export default rule;

function isFindIndexCall(node: TSESTree.Node): boolean {
  return (
    node.type === "CallExpression" &&
    node.callee.type === "MemberExpression" &&
    node.callee.property.type === "Identifier" &&
    node.callee.property.name === "findIndex"
  );
}

function isIdent(node: TSESTree.Node, name: string): boolean {
  return node.type === "Identifier" && node.name === name;
}

function findInNodes(nodes: Array<TSESTree.Node>, visitor: (n: TSESTree.Node) => boolean): boolean {
  for (const child of nodes) {
    if (findInNode(child, visitor)) return true;
  }
  return false;
}

function findInNode(node: TSESTree.Node | null | undefined, visitor: (n: TSESTree.Node) => boolean): boolean {
  if (!node || typeof node !== "object") return false;
  if (Array.isArray(node)) return findInNodes(node as Array<TSESTree.Node>, visitor);
  if (!("type" in node)) return false;
  if (visitor(node)) return true;
  for (const key of Object.keys(node)) {
    if (key === "parent") continue;
    const child = (node as unknown as Record<string, unknown>)[key];
    if (child && typeof child === "object") {
      if (findInNode(child as TSESTree.Node, visitor)) return true;
    }
  }
  return false;
}
