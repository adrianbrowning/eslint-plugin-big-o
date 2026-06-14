---
name: big-o-patterns
description: Identifies and fixes hidden O(n^2) complexity patterns in JavaScript/TypeScript code before they cause production performance failures. Covers five patterns where idiomatic, readable JS secretly becomes quadratic at scale: array lookups in loops, quadratic deduplication, chained map/filter with hidden finds, recursive tree flattening with spread, and N+1 queries. Use when writing or reviewing JS/TS code that iterates over arrays, deduplicates data, joins/enriches collections, flattens trees, or queries in loops.
---

# Big-O Patterns: Avoiding Hidden O(n^2)

**The rule**: any O(n) operation inside a loop = O(n^2). Pre-build a `Map` or `Set` before the loop.

## 5 patterns — quick reference

| Pattern | Anti-pattern | Fix |
|---------|-------------|-----|
| 1. Array lookup in iteration | `arr.find/includes/indexOf` inside `map/filter/reduce` | Pre-build `Map`/`Set` |
| 2. Quadratic dedup | `filter((x,i) => arr.findIndex(...) === i)` | `Set` accumulator or `new Map(...).values()` |
| 3. Hidden lookup in chain | `.find()` buried inside `.map().filter()` chain | Hoist `Map` before chain |
| 4. Spread-in-reduce tree flatten | `flat.push(...recurse(node.children))` in `reduce` | Pass accumulator: `recurse(children, result)` |
| 5. N+1 query | `await db.query(...)` in a `for` loop | Batch with `WHERE id IN (?)` |

## Lookup cheatsheet

| Use | Instead of | Why |
|-----|-----------|-----|
| `Set.has(x)` | `arr.includes(x)` | O(1) vs O(n) |
| `Map.get(k)` | `arr.find(x => x.id === k)` | O(1) vs O(n) |
| `Map.get(k)` | `arr.indexOf(k)` | O(1) vs O(n) |

**Default to `Map`/`Set` when joining or deduplicating.** See [REFERENCE.md](REFERENCE.md) for full before/after code per pattern.
