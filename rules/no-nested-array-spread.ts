import { ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";
import type ts from "typescript";

const createRule = ESLintUtils.RuleCreator(name => `https://github.com/adrianbrowning/eslint-plugin-big-o/blob/main/docs/rules/${name}.md`);

const rule = createRule({
  name: "no-nested-array-spread",
  meta: {
    type: "suggestion",
    schema: [],
    messages: {
      nestedArraySpread: "O(n²): spreading a recursive call result inside reduce creates quadratic copies. Pass accumulator by reference instead.",
    },
    docs: {
      description: "Disallow O(n²) recursive spread inside reduce callbacks",
    },
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context, true);
    const checker = services.program?.getTypeChecker();

    return {
      SpreadElement(node: TSESTree.SpreadElement) {
        if (node.argument.type !== "CallExpression") return;

        const call = node.argument;
        const calleeName = getCalleeName(call);
        if (!calleeName) return;

        if (!isInsideReduceCallback(node, checker, services)) return;

        if (isRecursiveCall(node, calleeName)) {
          context.report({ node, messageId: "nestedArraySpread" });
        }
      },
    };
  },
});

export default rule;

function getCalleeName(call: TSESTree.CallExpression): string | null {
  if (call.callee.type === "Identifier") return call.callee.name;
  return null;
}

function isReduceOnArray(
  node: TSESTree.CallExpression,
  checker: ts.TypeChecker | undefined,
  services: ReturnType<typeof ESLintUtils.getParserServices>
): boolean {
  if (node.callee.type !== "MemberExpression") return false;
  const { property, object } = node.callee;
  if (property.type !== "Identifier" || property.name !== "reduce") return false;
  if (!checker) return true;
  const type = checker.getTypeAtLocation(services.esTreeNodeToTSNodeMap.get(object));
  return checker.isArrayType(type) || checker.isTupleType(type);
}

function isInsideReduceCallback(
  node: TSESTree.Node,
  checker: ts.TypeChecker | undefined,
  services: ReturnType<typeof ESLintUtils.getParserServices>
): boolean {
  let current: TSESTree.Node | undefined = node.parent;
  while (current) {
    if (current.type === "CallExpression" && isReduceOnArray(current, checker, services)) {
      const callback = current.arguments[0] as TSESTree.Node | undefined;
      if (callback && isAncestor(callback, node)) return true;
    }
    current = current.parent;
  }
  return false;
}

function isAncestor(ancestor: TSESTree.Node, node: TSESTree.Node): boolean {
  let current: TSESTree.Node | undefined = node;
  while (current) {
    if (current === ancestor) return true;
    current = current.parent;
  }
  return false;
}

function isRecursiveCall(node: TSESTree.Node, calleeName: string): boolean {
  let current: TSESTree.Node | undefined = node.parent;
  while (current) {
    if (
      (current.type === "FunctionDeclaration" || current.type === "FunctionExpression") &&
      current.id?.name === calleeName
    ) {
      return true;
    }
    if (
      current.type === "ArrowFunctionExpression" &&
      current.parent.type === "VariableDeclarator" &&
      current.parent.id.type === "Identifier" &&
      current.parent.id.name === calleeName
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
}
