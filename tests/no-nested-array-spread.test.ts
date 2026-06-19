import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";
import rule from "../rules/no-nested-array-spread.ts";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: {
        allowDefaultProject: [ "*.ts*" ],
      },
      tsconfigRootDir: dirname(fileURLToPath(import.meta.url)),
    },
  },
});

tester.run("no-nested-array-spread", rule, {
  valid: [
    {
      code: `function flatten(nodes: {children?: typeof nodes}[], result: typeof nodes = []) {
               for (const node of nodes) {
                 result.push(node);
                 if (node.children) flatten(node.children, result);
               }
               return result;
             }`,
      filename: "test.ts",
      name: "accumulator-based flatten — O(n)",
    },
  ],
  invalid: [
    {
      code: `function flatten(nodes: {children?: typeof nodes}[]): typeof nodes {
               return nodes.reduce((flat, node) => {
                 flat.push(node);
                 if (node.children) flat.push(...flatten(node.children));
                 return flat;
               }, [] as typeof nodes);
             }`,
      filename: "test.ts",
      name: "spread of recursive call inside reduce — O(n²)",
      errors: [{ messageId: "nestedArraySpread" }],
    },
    {
      code: `function flatten(nodes: {children?: typeof nodes}[]): typeof nodes {
               return nodes.reduce((acc, node) => [...acc, node, ...flatten(node.children || [])], [] as typeof nodes);
             }`,
      filename: "test.ts",
      name: "spread accumulator pattern inside reduce — O(n²)",
      errors: [{ messageId: "nestedArraySpread" }],
    },
  ],
});
