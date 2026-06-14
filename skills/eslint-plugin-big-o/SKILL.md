---
name: eslint-plugin-big-o
description: Detect hidden O(n^2) complexity patterns in JavaScript/TypeScript using ESLint. Covers find/includes/indexOf inside map/filter/reduce, quadratic deduplication via findIndex, and O(n^2) recursive tree flattening via spread-in-reduce. Use when implementing or reviewing eslint-plugin-big-o rules, adding new O(n^2) pattern detectors, or explaining why a rule fires and how to fix it.
---

# eslint-plugin-big-o

Catches 5 hidden O(n^2) patterns from production JS code. See [REFERENCE.md](REFERENCE.md) for all patterns + fixes.

## Quick start

```js
// eslint.config.js
import bigO from 'eslint-plugin-big-o';
export default [bigO.configs.recommended];
```

## Rules

| Rule | Detects | Severity |
|------|---------|----------|
| `big-o/no-array-lookup-in-loop` | `find/includes/indexOf` inside `map/filter/reduce` | warn |
| `big-o/no-quadratic-dedup` | `findIndex === idx` dedup pattern | warn |
| `big-o/no-nested-array-spread` | spread of recursive call inside `reduce` | warn |

## Fix summary

| Anti-pattern | Fix |
|-------------|-----|
| `arr.find()` inside loop | Pre-build `Map` for O(1) `.get()` |
| `arr.includes()` inside loop | Pre-build `Set` for O(1) `.has()` |
| `items.filter((x,i) => items.findIndex(...) === i)` | Use `Set`-based dedup |
| `flat.push(...recurse(node.children))` in reduce | Pass accumulator: `recurse(children, result)` |
| N+1 SQL query in loop | Batch with `WHERE id IN (?)` |

## Adding a new rule

1. Write failing test in `tests/<rule>.test.js` with `RuleTester`
2. Create `rules/<rule>.js` (see [REFERENCE.md](REFERENCE.md) for rule anatomy)
3. Register in `index.js` under `plugin.rules` and `plugin.configs.recommended.rules`
4. `pnpm test`

## Key ESLint v9+ note

Use `context.sourceCode.getAncestors(node)` — `context.getAncestors()` is deprecated.
