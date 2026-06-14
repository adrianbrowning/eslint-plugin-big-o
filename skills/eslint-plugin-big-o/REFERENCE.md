# eslint-plugin-big-o — Reference

## The 5 O(n^2) patterns

### Pattern 1 — Array lookup inside iteration
```js
// BAD O(n*m)
allUsers.filter(u => activeIds.includes(u.id))
orders.map(o => ({ ...o, c: customers.find(c => c.id === o.customerId) }))

// GOOD O(n+m)
const activeSet = new Set(activeIds);
allUsers.filter(u => activeSet.has(u.id))

const custMap = new Map(customers.map(c => [c.id, c]));
orders.map(o => ({ ...o, c: custMap.get(o.customerId) }))
```

### Pattern 2 — Quadratic dedup
```js
// BAD O(n^2)
const unique = items.filter((item, i) => items.findIndex(x => x.id === item.id) === i)

// GOOD O(n)
const seen = new Set();
const unique = items.filter(item => {
  if (seen.has(item.id)) return false;
  seen.add(item.id);
  return true;
});
// OR
const unique = [...new Map(items.map(i => [i.id, i])).values()]
```

### Pattern 3 — Cascading map/filter/map with hidden lookup
Same as Pattern 1 — `.find()` buried in a chain. Pre-build lookup before the chain.

### Pattern 4 — Recursive tree flattener with spread-in-reduce
```js
// BAD O(n^2) — spread copies grow with each recursion
function flatten(nodes) {
  return nodes.reduce((flat, node) => {
    flat.push(node);
    if (node.children) flat.push(...flatten(node.children));
    return flat;
  }, []);
}

// GOOD O(n) — pass accumulator through
function flatten(nodes, result = []) {
  for (const node of nodes) {
    result.push(node);
    if (node.children) flatten(node.children, result);
  }
  return result;
}
```

### Pattern 5 — N+1 SQL query (not statically detectable)
```js
// BAD: 1 + n round trips
for (const order of orders) {
  order.items = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
}

// GOOD: 2 queries total
const items = await db.query('SELECT * FROM order_items WHERE order_id IN (?)', [orderIds]);
```

## Rule anatomy

```js
export default {
  meta: {
    type: 'suggestion',
    docs: { description: '...', url: '...' },
    messages: { ruleId: 'O(n^2): {{method}} inside {{outer}}. Fix: ...' },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) { /* visit AST */ },
    };
  },
};
```

## Complexity reference

| Operation | Complexity |
|-----------|-----------|
| `Array.includes()` | O(n) — use `Set.has()` |
| `Array.find()` | O(n) — use `Map.get()` |
| `Array.indexOf()` | O(n) — use `Map.get()` |
| `Set.has()` | O(1) |
| `Map.get()` | O(1) |
| `Array.sort()` | O(n log n) |
