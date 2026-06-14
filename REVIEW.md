# Code Review — eslint-plugin-big-o

**Verdict: ⚠️ Approved with Suggestions**
**5 Critical · 5 High · 9 Observations · 4 Positives**

---

## ❌ Critical

**1. `package.json:6` — `"main": "index.ts"` is TypeScript source**
Package is not publishable as-is. Consumers running Node will get a syntax error. Needs a `build` script producing compiled JS, then `"main": "dist/index.js"` (or similar).

**2. `package.json` — No `exports` field**
Modern Node/bundlers require `exports`. ESM consumers won't resolve the package correctly without it.

**3. `package.json` — No `files` field**
`npm publish` will include `.idea/`, `.husky/`, `tests/`, `skills/`, `pnpm-lock.yaml` — everything. Add `"files": ["dist", "README.md"]` (once build exists).

**4. `package.json` — `eslint` in `devDependencies` only, no `peerDependencies`**
ESLint plugins must declare eslint as a peer dep. Consumers won't get a warning if they're missing it or on a wrong version.

**5. `package.json` — No `build` script**
No path from TypeScript source to distributable JS. The whole publish story is broken.

---

## ⚠️ High

**6. `rules/no-nested-array-spread.ts:64-76` — `isRecursiveCall` misses arrow functions**
Only checks `FunctionDeclaration` and `FunctionExpression` with `.id?.name`. `const flatten = (nodes) => nodes.reduce(...)` never matches — rule silently passes the pattern it's supposed to catch.

**7. `package.json:9` — `lint:esl` and `lint:s` target `src/**/*.{j,t}s{,x}` — no `src/` dir**
Source lives at root (`rules/`, `index.ts`). These lint scripts never execute on actual code.

**8. `tsconfig.json:4-8` — `include` missing `index.ts`**
`index.ts` is the entry point but not in `include`. TypeScript won't type-check it.

**9. `knip.json:3` — entry `src/**/*.{js,ts}` wrong path**
Same `src/` problem. Knip finds nothing and reports no dead code, giving false confidence.

**10. `package.json:14` — `lint` uses `;` not `&&`**
`pnpm lint:ts; pnpm lint:fix` — type errors don't block the fix step. Use `&&`.

---

## 💬 Observations

- **No CI config** — no `.github/workflows/`. Tests and lint only run via husky (skippable). Add a CI workflow.
- **Double-warning overlap** — the `filter + findIndex` dedup pattern triggers both `no-array-lookup-in-loop` AND `no-quadratic-dedup`. Users get two warnings for one issue. Consider whether `no-array-lookup-in-loop` should carve out the dedup pattern.
- **`pre-push` hook** runs `pnpm lint:fix` which mutates files — push hooks should be read-only checks only.
- **`tsconfig.json:7`** — `"./rules/**.ts"` double glob is non-standard. Use `"./rules/*.ts"` or `"./rules/**/*.ts"`.
- **`index.ts:21`** — `configs: {}` initialized then immediately overwritten on line 24 to avoid circular ref — works but confusing. A comment explaining the pattern would help.
- **`no-array-lookup-in-loop`** only catches array method callbacks (`map`, `filter`, etc.), not imperative `for` loops. Worth documenting as a known limitation.
- **`no-nested-array-spread` test** valid case uses `for...of`, not a reduce-without-spread. Add a valid case that uses reduce correctly (push without spread) to prove the rule doesn't over-fire.
- **`package.json`** — `description: ""`, `keywords: []`, no `repository` field. Bad for npm discoverability.
- **No autofix (`fixable`) on any rule** — acceptable for suggestion rules, but common patterns like dedup could offer a fix.

---

## ✅ Positives

- Clean per-rule file structure — easy to add more rules.
- Correct modern ESLint API usage: `context.sourceCode.getAncestors(node)` (not deprecated `context.getAncestors()`).
- `Set` used for O(1) method-name lookups in rule constants.
- `RuleTester` + vitest integration is correct and covers valid/invalid cases.

---

## Priority Order

1. Build pipeline (Critical #1–5) — unblocks publishing
2. Arrow function detection in `no-nested-array-spread` (High #6) — correctness bug
3. Fix lint script paths (High #7) — linting currently a no-op
4. Add `index.ts` to tsconfig `include` (High #8)
5. Fix knip entry path (High #9)
6. Add CI workflow (Observation)
