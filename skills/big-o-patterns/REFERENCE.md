# Big-O Patterns — Full Reference

Source: "The O(n^2) Bug That Looked Like Clean Code" — kitmul.com

## Why this matters

Quadratic complexity is invisible until it isn't:
- At n=200: 40,000 comparisons — fine
- At n=2,000: 4,000,000 — slow
- At n=20,000: 400,000,000 — API timeout

Every pattern below passed code review because it looked idiomatic. None scaled.

---

## Pattern 1 — Array lookup inside iteration

**Trigger**: `find/includes/indexOf/findIndex` called inside `map/filter/reduce/forEach` callback.

```js
// INCIDENT: users × permissions join, O(n^2), 14s p99 latency at 20k users
const results = users.map(user => {
  const match = permissions.find(p => p.userId === user.id);
  return { ...user, role: match?.role ?? 'viewer' };
});

// FIX: pre-build Map, O(n+m)
const permMap = new Map(permissions.map(p => [p.userId, p.role]));
const results = users.map(user => ({
  ...user,
  role: permMap.get(user.id) ?? 'viewer',
}));
```

**Rule**: `big-o/no-array-lookup-in-loop`

---

## Pattern 2 — Quadratic deduplication

**Trigger**: `filter((item, i) => arr.findIndex(...) === i)` — findIndex restarts from 0 every element.

```js
// BAD: up to 100M comparisons at 10k items
const unique = items.filter((item, i) =>
  items.findIndex(x => x.id === item.id) === i
);

// FIX option A: Set accumulator
const seen = new Set();
const unique = items.filter(item => {
  if (seen.has(item.id)) return false;
  seen.add(item.id);
  return true;
});

// FIX option B: Map (preserves last occurrence)
const unique = [...new Map(items.map(i => [i.id, i])).values()];
```

**Rule**: `big-o/no-quadratic-dedup`

---

## Pattern 3 — Cascading map/filter/map with hidden find

The chain itself is O(n) — the `.find()` inside makes it O(n^2).

```js
// BAD
const enriched = orders
  .map(order => ({
    ...order,
    customer: customers.find(c => c.id === order.customerId), // hidden O(n)
  }))
  .filter(order => order.customer?.active)
  .map(order => formatForDisplay(order));

// FIX: hoist lookup before chain
const customerMap = new Map(customers.map(c => [c.id, c]));
const enriched = orders
  .map(order => ({ ...order, customer: customerMap.get(order.customerId) }))
  .filter(order => order.customer?.active)
  .map(order => formatForDisplay(order));
```

**Rule**: `big-o/no-array-lookup-in-loop` (catches the `.find()` inside `.map()`)

---

## Pattern 4 — Recursive tree flattener with spread-in-reduce

**Trigger**: `flat.push(...recursiveFn(node.children))` or `[...acc, ...recursiveFn(x)]` inside `reduce`.

Each spread allocates a new array. For n nodes in a balanced tree: O(n^2) total copies.

```js
// BAD
function flattenComments(comments) {
  return comments.reduce((flat, comment) => {
    flat.push(comment);
    if (comment.replies) {
      flat.push(...flattenComments(comment.replies)); // O(n^2)
    }
    return flat;
  }, []);
}

// FIX: pass accumulator, zero allocations
function flattenComments(comments, result = []) {
  for (const comment of comments) {
    result.push(comment);
    if (comment.replies) flattenComments(comment.replies, result);
  }
  return result;
}
```

**Rule**: `big-o/no-nested-array-spread`

---

## Pattern 5 — N+1 query

**Trigger**: `await db.query(...)` inside a `for` loop over a result set.

```js
// BAD: 1 + n queries (1001 round trips for 1000 orders)
const orders = await db.query('SELECT * FROM orders WHERE status = ?', ['active']);
for (const order of orders) {
  order.items = await db.query(
    'SELECT * FROM order_items WHERE order_id = ?',
    [order.id]
  );
}

// FIX: batch query, 2 round trips total
const orders = await db.query('SELECT * FROM orders WHERE status = ?', ['active']);
const orderIds = orders.map(o => o.id);
const allItems = await db.query(
  'SELECT * FROM order_items WHERE order_id IN (?)',
  [orderIds]
);
const itemsByOrder = allItems.reduce((map, item) => {
  (map[item.orderId] ??= []).push(item);
  return map;
}, {});
orders.forEach(o => { o.items = itemsByOrder[o.id] ?? []; });
```

Not statically detectable by ESLint without ORM-specific analysis.

---

## How to catch quadratic complexity before production

1. **Profile with realistic data** — test with production cardinality, not 10 records
2. **Grep for danger**: `find/includes/indexOf` inside `map/filter/reduce` callbacks
3. **Annotate reviews**: ask "what is n? how big can it get? what's inner complexity?"
4. **Set latency alerts**: p95 > 500ms pages someone — quadratic shows as gradual degradation
5. **Default to Map/Set**: reach for them first when joining or deduplicating collections
