---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Querying Data

[[toc]]

You can query data from the store using the [Feathers Query Syntax](https://feathersjs.com/api/databases/querying.html)
with the `findInStore` method.

<BlockQuote label="$select is disabled">

The `$select` filter in local queries is ignored. The purpose of `$select` is to choose a subset of keys on the API
server data to return. The primary goal for this functionality is to reduce the amount of transferred data. In client
apps, the data is naturally filtered out of the UI through template-specific bindings.

</BlockQuote>

## Local Params API

The following custom params are available for working with local store methods.

<BlockQuote label="Notice" type="warning">
For security, the Feathers Client does not send params other than `query` to the API server.
</BlockQuote>

### params.temps

By default, queries do not include temporary records. You can add temporary records to the query results by setting
`params.temps` to true.

```ts
const { data } = service.findInStoreInStore({ query: {}, temps: true })
```

### params.clones

Store queries normally return data from `items` (or `temps` if `params.temps` is used). If you pass `params.clones` as
`true` it will return clones of the matching items. This applies to the `findInStore` and `getFromStore` methods on the
model and store:

```ts
const { data } = service.findInStoreInStore({ query: {}, clones: true })
data.forEach(item => {
  console.log(item.__isClone) // --> true
})
```

The `clones` param can be used together with `temps`, as well:

```ts
const { data } = service.findInStoreInStore({ query: {}, clones: true, temps: true })
```

Note that any existing clones are re-used, so if you need the clone to match the latest data you need to call
`clone.reset()`, manually.

## All [sift](https://github.com/crcn/sift.js/) operators enabled locally

There's no need to manually add a sift operator to the whitelist. They've all been enabled, internally, for store
queries, only.

These are part of the Feathers Query Syntax, and are enabled, by default, on the server.

- [$in](https://github.com/crcn/sift.js/#in)
- [$nin](https://github.com/crcn/sift.js/#nin)
- [$exists](https://github.com/crcn/sift.js/#exists)
- [$gte](https://github.com/crcn/sift.js/#gte)
- [$gt](https://github.com/crcn/sift.js/#gt)
- [$lte](https://github.com/crcn/sift.js/#lte)
- [$lt](https://github.com/crcn/sift.js/#lt)
- [$and](https://github.com/crcn/sift.js/#and)
- [$or](https://github.com/crcn/sift.js/#or)
- [$nor](https://github.com/crcn/sift.js/#nor)

These are enabled, by default, in the store.

- [$eq](#equality-🕊️) 🌱
- [$ne](#ne-🕊️) 🌱
- [$mod](#mod-🌱) 🌱
- [$all](#all-🌱) 🌱
- [$not](#not-🌱) 🌱
- [$size](#size-🌱) 🌱
- [$type](#type-🌱)
- [$regex](#regex-🌱) 🌱
- [$options](#options-🌱) 🌱
- [$where](https://github.com/crcn/sift.js/#where) 🌱
- [$elemMatch](https://github.com/crcn/sift.js/#elemmatch) 🌱

You won't be able to use operators from this second list on the server without configuring your query validators.

## Query Props Overview

**Feathers-Pinia supports all of the following query props**, however, different filters and operators are supported by
different databases. The following key indicates support:

- 🕊️ all Feathers Database Adapters
- 🌱 the [MongoDB Adapter](https://feathersjs.com/api/databases/mongodb.html)
- 🚩 one of the SQL Adapters ([see @feathersjs/knex](https://feathersjs.com/api/databases/knex.html))

If your Feathers API Service supports any of these operators, you can use the operators in
[useFind queries](/guide/use-find) to speed up user experience with the fall-through cache.

### Filters

Filters are special properties (starting with a $) added at the top level of a query.

#### $limit 🕊️

`$limit` limits the number of records returned. [docs](https://feathersjs.com/api/databases/querying.html#limit)

> 🕊️ Supported by all database adapters.

  ```ts
  [
    { id: 1, name: 'Bob' },
    { id: 2, name: 'Joe' },
    { id: 3, name: 'Mary' },
  ]
  ```

  ```ts
  service.findInStore({ query: { $limit: 1 } })
  ```

  ```ts
  [
    { id: 1, name: 'Bob' },
  ]
  ```

#### $skip 🕊️

`$skip` skips the number of records indicated. [docs](https://feathersjs.com/api/databases/querying.html#skip)

> 🕊️ Supported by all database adapters.

  ```ts
  [
    { id: 1, name: 'Bob' },
    { id: 2, name: 'Joe' },
    { id: 3, name: 'Mary' },
  ]
  ```

  ```ts
  service.findInStore({ query: { $limit: 1, $skip: 1 } })
  ```

  ```ts
  [
    { id: 2, name: 'Joe' },
  ]
  ```

#### $sort 🕊️

`$sort` sorts data in the direction indicated by `1` (ascending) or `-1` (descending).
[docs](https://feathersjs.com/api/databases/querying.html#sort)

> 🕊️ Supported by all database adapters.

  ```ts
  [
    { id: 1, name: 'Bob' },
    { id: 2, name: 'Joe' },
    { id: 3, name: 'Mary' },
  ]
  ```

  ```ts
  service.findInStore({ query: { $sort: { name: -1 } } })
  ```

  ```ts
  [
    { id: 3, name: 'Mary' },
    { id: 2, name: 'Joe' },
    { id: 1, name: 'Bob' },
  ]
  ```

#### $select  🕊️

`$select` restricts each object to the named keys. [docs](https://feathersjs.com/api/databases/querying.html#select)

> 🕊️ Supported by all database adapters.

<BlockQuote type="info" label="ignored for local queries">
Feathers-Pinia local queries will always return the full object and ignore `$select`. Queries to API servers will work
as normal.
</BlockQuote>

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

  ```ts
  service.findInStore({ query: { $select: ['id', 'name'] } })
  ```

  ```ts
  [
    { id: 1, name: 'Bob' },
    { id: 2, name: 'Joe' },
    { id: 3, name: 'Mary' },
  ]
  ```

#### $or 🕊️

`$or` matches records against any query provided in its array of queries. [docs](https://feathersjs.com/api/databases/querying.html#or)

> 🕊️ Supported by all database adapters.

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

  ```ts
  service.findInStore({ query: { $or: [{ name: 'Bob' }, { id: 3 }] } })
  ```

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

#### $nor 🌱

> 🌱 Supported by MongoDB (requires query schema update)

`$nor` matches records that match non of the queries provided in the array.

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

  ```ts
  service.findInStore({ query: { $nor: [{ name: 'Bob' }, { id: 3 }] } })
  ```

  ```ts
  [
    { id: 2, name: 'Joe', age: 21 },
  ]
  ```

#### $and 🌱 🚩

`$and` matches records which match all queries provided in its array.

> 🌱 🚩 Supported by [MongoDB](https://feathersjs.com/api/databases/mongodb.html) and [Knex](https://feathersjs.com/api/databases/knex.html)

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

  ```ts
  service.findInStore({ 
    query: { 
      $and: [
        { age: { $gt: 20 } },
        { id: { $gt: 2 } }
      ] 
    } 
  })
  ```

  ```ts
  [
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

### Operators

Operators either query a property for a specific value or determine nested special properties (starting with a $) that
allow querying the property for certain conditions. When multiple operators are set, conditions have to apply for a
property to match.

#### Equality 🕊️

Matches if an object has the same key:value pair as provided in the query. [docs](https://feathersjs.com/api/databases/querying.html#equality)

> 🕊️ Supported by all database adapters.

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

  ```ts
  service.findInStore({ name: 'Mary' })
  ```

  ```ts
  [
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

#### $in 🕊️

`$in` matches any record with a value matching any of the values in the array. [docs](https://feathersjs.com/api/databases/querying.html#in-nin)

> 🕊️ Supported by all database adapters.

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

  ```ts
  service.findInStore({ name: { $in: ['Mary', 'Bob'] } })
  ```

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

#### $nin 🕊️

`$nin` matches any record with no matching value from the array. [docs](https://feathersjs.com/api/databases/querying.html#in-nin)

> 🕊️ Supported by all database adapters.

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

  ```ts
  service.findInStore({ name: { $nin: ['Mary', 'Bob'] } })
  ```

  ```ts
  [
    { id: 2, name: 'Joe', age: 21 },
  ]
  ```

#### $lt 🕊️

`$lt` matches any value less than the provided value. [docs](https://feathersjs.com/api/databases/querying.html#lt-lte)

> 🕊️ Supported by all database adapters.

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

  ```ts
  service.findInStore({ name: { $lt: 35 } })
  ```

  ```ts
  [
    { id: 2, name: 'Joe', age: 21 },
  ]
  ```

#### $lte 🕊️

`$lte` matches any value less than or equal to the provided value. [docs](https://feathersjs.com/api/databases/querying.html#lt-lte)

> 🕊️ Supported by all database adapters.

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

  ```ts
  service.findInStore({ name: { $lte: 35 } })
  ```

  ```ts
  [
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

#### $gt 🕊️

`$gt` matches any value greater than the provided value. [docs](https://feathersjs.com/api/databases/querying.html#gt-gte)

> 🕊️ Supported by all database adapters.

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

  ```ts
  service.findInStore({ name: { $gt: 35 } })
  ```

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
  ]
  ```

#### $gte 🕊️

`$gte` matches any value greater than or equal to the provided value. [docs](https://feathersjs.com/api/databases/querying.html#gt-gte)

> 🕊️ Supported by all database adapters.

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

  ```ts
  service.findInStore({ name: { $gte: 35 } })
  ```

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

#### $ne 🕊️

`$ne` matches any value that does not equal the provided value [docs](https://feathersjs.com/api/databases/querying.html#ne)

> 🕊️ Supported by all database adapters.

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

  ```ts
  service.findInStore({ name: { $ne: 35 } })
  ```

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
  ]
  ```

### MongoDB Operators

These are additional operators that are supported by MongoDB databases. You can enable them in your query syntax on the
backend.

#### $exists 🌱

`$exists` matches if the property is not `null` or `undefined` [docs](https://www.mongodb.com/docs/manual/reference/operator/query/exists/)

> 🌱 Supported by [MongoDB](https://feathersjs.com/api/databases/mongodb.html)

  ```ts
  [
    { _id: 1, name: 'Bob' },
    { _id: 2, name: null },
    { _id: 3, name: 'Mary' },
  ]
  ```

  ```ts
  service.findInStore({ query: { name: { $exists: true } } })
  ```

  ```ts
  [
    { _id: 1, name: 'Bob' },
    { _id: 3, name: 'Mary' },
  ]
  ```

#### $mod 🌱

`$mod` matches where the value of a field divided by a divisor has the specified remainder. [docs](https://www.mongodb.com/docs/manual/reference/operator/query/mod/)

> 🌱 Supported by [MongoDB](https://feathersjs.com/api/databases/mongodb.html)

  ```ts
  [
    { _id: 1, item: 'Banana', qty: 0 },
    { _id: 2, item: 'Apple', qty: 5 },
    { _id: 3, item: 'Orange', qty: 12 }
  ]
  ```

  ```ts
  service.findInStore({ query: { qty: { $mod: [ 4, 0 ] } } })
  ```

  ```ts
  [
    { _id: 1, item: 'Banana', qty: 0 },
    { _id: 3, item: 'Orange', qty: 12 }
  ]
  ```

#### $all 🌱

`$all` matches when an array value contains all the specified elements. [docs](https://www.mongodb.com/docs/manual/reference/operator/query/all/)

> 🌱 Supported by [MongoDB](https://feathersjs.com/api/databases/mongodb.html)

  ```ts
  [
    { _id: 1, name: 'Bob', languages: ['English'] },
    { _id: 2, name: 'Joe', languages: ['English', 'Spanish'] },
    { _id: 3, name: 'Mary', languages: ['Spanish'] },
  ]
  ```

  ```ts
  service.findInStore({ query: { languages: { $all: ['Spanish', 'English'] } } })
  ```

  ```ts
  [
    { _id: 2, name: 'Joe', languages: ['English', 'Spanish'] },
  ]
  ```

#### $size 🌱

`$size` matches when the array field's length matches the provided number. [docs](https://www.mongodb.com/docs/manual/reference/operator/query/size/)

> 🌱 Supported by [MongoDB](https://feathersjs.com/api/databases/mongodb.html)

  ```ts
  [
    { _id: 1, name: 'Bob', languages: ['English'] },
    { _id: 2, name: 'Joe', languages: ['English', 'Spanish'] },
    { _id: 3, name: 'Mary', languages: ['Spanish'] },
  ]
  ```

  ```ts
  service.findInStore({ query: { languages: { $size: 1 } } })
  ```

  ```ts
  [
    { _id: 1, name: 'Bob', languages: ['English'] },
    { _id: 3, name: 'Mary', languages: ['Spanish'] },
  ]
  ```

#### $regex 🌱

`$regex` matches a regular expression against a value based on matching `$options`. [docs](https://www.mongodb.com/docs/manual/reference/operator/query/regex/)

> 🌱 Supported by [MongoDB](https://feathersjs.com/api/databases/mongodb.html)

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

  ```ts
  // Match any `name` with an "o" in it
  service.findInStore({ name: { $regex: 'o', $options 'igm' } })
  ```

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
  ]
  ```

#### $options 🌱

Can only be used with the `$regex` operator. See above.

> 🌱 Supported by [MongoDB](https://feathersjs.com/api/databases/mongodb.html)

#### $not 🌱

`$not` performs a logical NOT operation on the specified query. [docs](https://www.mongodb.com/docs/manual/reference/operator/query/not/)

> 🌱 Supported by [MongoDB](https://feathersjs.com/api/databases/mongodb.html)

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

  ```ts
  // Match any `name` without an "o" in it
  service.findInStore({ name: { $not: { $regex: 'o', $options 'igm' } } })
  ```

  ```ts
  [
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

#### $type 🌱

`$type` matches when the type of the value matches the provided JS constructor.

> Only supported by local queries. A [variation of $type](https://www.mongodb.com/docs/manual/reference/operator/query/type/)
is supported by MongoDB, but uses alias strings instead of JS constructors.

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: null },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

  ```ts
  service.findInStore({ age: { $type: Number } })
  ```

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

#### $where 🌱

<https://www.mongodb.com/docs/manual/reference/operator/query/where/>

<BlockQuote type="danger">

In general, do not enable the API server to use `$where` in queries. It can enable too much querying freedom and expose
data to unauthorized users. Unless you are going to put in the time to build the tooling to make it safe, only use it
for store queries. Even then, you likely don't need it, since the entire query is a where clause.

</BlockQuote>

#### $elemMatch 🌱

```ts
  [
  {
    month: "july",
    casts: [
      { id: 1, value: 200 },
      { id: 2, value: 1000 }
    ]
  },
  {
    month: "august",
    casts: [
      { id: 3, value: 1000 },
      { id: 4, value: 4000 }
    ]
  }
]
  ```

  ```ts
  service.findInStore({ casts: { $elemMatch: { value: { $gt: 1000 } } } })
  ```

  ```ts
  [
    {
      month: "august",
      casts: [
        { id: 3, value: 1000 },
        { id: 4, value: 4000 } // matches since 4000 > 1000
      ]
    }
  ]
  ```

### SQL Operators

#### $like 🚩

`$like` performs a case-sensitive match on values.

> 🚩 Supported by these SQL Adapters: [Knex](https://feathersjs.com/api/databases/knex.html#like), [Objection](https://github.com/feathersjs-ecosystem/feathers-objection#default-query-operators), [Sequelize](https://github.com/feathersjs-ecosystem/feathers-sequelize)

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

  ```ts
  // Match any `name` with an "o" in it
  service.findInStore({ name: { $like: '%o%' } })
  ```

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
  ]
  ```

#### $ilike 🚩

`$ilike` performs a case-insensitive match on values.

> 🚩 Supported by these SQL Adapters: [Knex](https://feathersjs.com/api/databases/knex.html#like), [Objection](https://github.com/feathersjs-ecosystem/feathers-objection#default-query-operators)

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

  ```ts
  // Match any `name` with an "o" in it
  service.findInStore({ name: { $ilike: 'b%' } })
  ```

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
  ]
  ```

#### $iLike 🚩

See `$ilike`.

> 🚩 Supported by these SQL Adapters: [Sequelize](https://github.com/feathersjs-ecosystem/feathers-sequelize)

#### $notlike 🚩

`$notlike` performs a case-sensitive negative match against values.

> 🚩 Supported by these SQL Adapters: [Knex](https://feathersjs.com/api/databases/knex.html#like), [Sequelize](https://github.com/feathersjs-ecosystem/feathers-sequelize)

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

  ```ts
  // Match any `name` with an "o" in it
  service.findInStore({ name: { $notlike: 'B%' } })
  ```

  ```ts
  [
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

#### $notLike 🚩

See `$notlike`performs a case-insensitive negative match against values.

> 🚩 Supported by these SQL Adapters: [Objection](https://github.com/feathersjs-ecosystem/feathers-objection#default-query-operators), [Sequelize](https://github.com/feathersjs-ecosystem/feathers-sequelize)

#### $notILike 🚩

`$notILike`

> 🚩 Supported by these SQL Adapters: [Objection](https://github.com/feathersjs-ecosystem/feathers-objection#default-query-operators), [Sequelize](https://github.com/feathersjs-ecosystem/feathers-sequelize)

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

  ```ts
  // Match any `name` with an "o" in it
  service.findInStore({ name: { $notILike: 'b%' } })
  ```

  ```ts
  [
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```
