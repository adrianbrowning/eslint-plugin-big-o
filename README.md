# eslint-plugin-big-o

[![npm version](https://img.shields.io/npm/v/eslint-plugin-big-o.svg)](https://www.npmjs.com/package/eslint-plugin-big-o)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

ESLint rules that catch accidental O(n²) patterns before they reach production.

## Requirements

- ESLint ≥ 9.0.0 (flat config)
- Node.js ≥ 24.0.0

## Installation

```sh
pnpm add -D eslint-plugin-big-o
```

## Usage

Add to your `eslint.config.js` (or `.ts`):

```js
import bigO from 'eslint-plugin-big-o'

export default [
  bigO.configs.recommended,
]
```

Or configure rules individually:

```js
import bigO from 'eslint-plugin-big-o'

export default [
  {
    plugins: { 'big-o': bigO },
    rules: {
      'big-o/no-array-lookup-in-loop': 'warn',
      'big-o/no-quadratic-dedup': 'warn',
      'big-o/no-nested-array-spread': 'warn',
    },
  },
]
```

## Rules

| Rule | Description | Complexity |
|------|-------------|------------|
| [`no-array-lookup-in-loop`](#no-array-lookup-in-loop) | Disallow linear search inside iteration callbacks | O(n) → O(1) |
| [`no-quadratic-dedup`](#no-quadratic-dedup) | Disallow filter+findIndex deduplication pattern | O(n²) → O(n) |
| [`no-nested-array-spread`](#no-nested-array-spread) | Disallow spreading recursive results inside reduce | O(n²) → O(n) |

---

### `no-array-lookup-in-loop`

Warns when `.find()`, `.findIndex()`, `.includes()`, or `.indexOf()` is called inside an iteration callback (`.map()`, `.filter()`, `.reduce()`, `.forEach()`, `.flatMap()`, `.some()`, `.every()`). Each outer iteration triggers a full inner scan — O(n²) total.

**Bad**

```js
const result = items.map(item =>
  other.find(o => o.id === item.id) // O(n²)
)
```

**Good**

```js
const otherMap = new Map(other.map(o => [o.id, o]))
const result = items.map(item => otherMap.get(item.id)) // O(n)
```

---

### `no-quadratic-dedup`

Warns on the common but quadratic deduplication idiom:  
`arr.filter((item, i) => arr.findIndex(x => ...) === i)`

Each `.filter` iteration calls `.findIndex`, which scans from the start — O(n²).

**Bad**

```js
const unique = arr.filter((item, i) =>
  arr.findIndex(x => x.id === item.id) === i // O(n²)
)
```

**Good**

```js
const seen = new Set()
const unique = arr.filter(item => {
  if (seen.has(item.id)) return false
  seen.add(item.id)
  return true
}) // O(n)

// or simply:
const unique = [...new Map(arr.map(x => [x.id, x])).values()] // O(n)
```

---

### `no-nested-array-spread`

Warns when a recursive function call is spread inside a `.reduce()` callback. Each recursive call creates a new array copy — O(n²) total allocations.

**Bad**

```js
function flatten(arr) {
  return arr.reduce((acc, item) =>
    Array.isArray(item)
      ? [...acc, ...flatten(item)] // O(n²) — new array each iteration
      : [...acc, item],
    []
  )
}
```

**Good**

```js
function flatten(arr) {
  return arr.reduce((acc, item) => {
    if (Array.isArray(item)) acc.push(...flatten(item))
    else acc.push(item)
    return acc // mutate in-place — O(n)
  }, [])
}
```

---

## License

[ISC](LICENSE) © Adrian Elton-Browning