import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";
import rule from "../rules/no-quadratic-dedup.ts";

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

tester.run("no-quadratic-dedup", rule, {
  valid: [
    {
      code: `const seen = new Set(); const items: number[] = []; const unique = items.filter(item => { if (seen.has(item)) return false; seen.add(item); return true; })`,
      filename: "test.ts",
      name: "Set-based dedup — O(n)",
    },
    {
      code: `const items: {id: number, name: string}[] = []; const unique = [...new Map(items.map(i => [i.id, i])).values()]`,
      filename: "test.ts",
      name: "Map-based dedup — O(n)",
    },
    {
      code: `class Coll { filter(fn: (x: number, i: number) => boolean) { return this; } findIndex(fn: (x: number) => boolean) { return -1; } }; const c = new Coll(); c.filter((x, i) => c.findIndex(y => y === x) === i)`,
      filename: "test.ts",
      name: "custom class with filter/findIndex — not an array",
    },
  ],
  invalid: [
    {
      code: `const items: {id: number}[] = []; const unique = items.filter((item, i) => items.findIndex(x => x.id === item.id) === i)`,
      filename: "test.ts",
      name: "filter+findIndex dedup on objects — O(n²)",
      errors: [{ messageId: "quadraticDedup" }],
    },
    {
      code: `const arr: number[] = []; const unique = arr.filter((el, idx) => arr.findIndex(e => e === el) === idx)`,
      filename: "test.ts",
      name: "filter+findIndex dedup on primitives — O(n²)",
      errors: [{ messageId: "quadraticDedup" }],
    },
  ],
});
