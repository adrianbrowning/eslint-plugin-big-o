import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";
import rule from "../rules/no-array-lookup-in-loop.ts";

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

tester.run("no-array-lookup-in-loop", rule, {
  valid: [
    // O(1) Set/Map lookups inside loops — fine
    {
      code: `const activeSet = new Set(activeIds); allUsers.filter(u => activeSet.has(u.id))`,
      filename: "test.ts",
      name: "Set.has inside filter",
    },
    {
      code: `const customerMap = new Map(customers.map(c => [c.id, c])); orders.map(order => ({ customer: customerMap.get(order.customerId) }))`,
      filename: "test.ts",
      name: "Map.get inside map",
    },
    {
      code: `const found = items.find(x => x.id === targetId)`,
      filename: "test.ts",
      name: "standalone find outside loop",
    },
    {
      code: `const ok = ['a','b'].includes(someValue)`,
      filename: "test.ts",
      name: "array includes outside loop",
    },
    // string.includes is substring search, not array scan — not O(n²)
    {
      code: `const someStr = 'hello world'; const items: string[] = []; items.map(item => someStr.includes(item))`,
      filename: "test.ts",
      name: "string.includes inside map",
    },
    {
      code: `const label = 'foo bar'; const items: string[] = []; items.filter(item => label.includes(item))`,
      filename: "test.ts",
      name: "string.includes inside filter",
    },
  ],
  invalid: [
    {
      code: `const activeIds: string[] = []; const allUsers: {id: string}[] = []; allUsers.filter(u => activeIds.includes(u.id))`,
      filename: "test.ts",
      name: "array.includes inside filter — O(n²)",
      errors: [{ messageId: "arrayLookupInLoop" }],
    },
    {
      code: `const items: {id: number}[] = []; items.filter((item, i) => items.findIndex(x => x.id === item.id) === i)`,
      filename: "test.ts",
      name: "findIndex inside filter — quadratic dedup",
      errors: [{ messageId: "arrayLookupInLoop" }],
    },
    {
      code: `const customers: {id: string}[] = []; const orders: {customerId: string}[] = []; orders.map(order => ({ customer: customers.find(c => c.id === order.customerId) }))`,
      filename: "test.ts",
      name: "find inside map — O(n²) join",
      errors: [{ messageId: "arrayLookupInLoop" }],
    },
    {
      code: `const permissions: {userId: string}[] = []; const users: {id: string}[] = []; users.forEach(u => { const p = permissions.find(p => p.userId === u.id); })`,
      filename: "test.ts",
      name: "find inside forEach",
      errors: [{ messageId: "arrayLookupInLoop" }],
    },
    {
      code: `const arr: number[] = []; arr.reduce((acc, x) => { arr.indexOf(x); return acc; }, [])`,
      filename: "test.ts",
      name: "indexOf inside reduce",
      errors: [{ messageId: "arrayLookupInLoop" }],
    },
  ],
});
