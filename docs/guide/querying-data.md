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

<BlockQuote label="Notice" type="danger">
As a security measure, the Feathers Client does not send query params to the API server.
</BlockQuote>

### params.temps

By default, queries do not include temporary records. You can add temporary records to the query results by setting
`params.temps` to true.

```ts
const { data } = Model.findInStore({ query: {}, temps: true })
```

### params.clones

Store queries normally return data from `items` (or `temps` if `params.temps` is used). If you pass `params.clones` as
`true` it will return clones of the matching items. This applies to the `findInStore` and `getFromStore` methods on the
model and store:

```ts
const { data } = Model.findInStore({ query: {}, clones: true })
data.forEach(item => {
  console.log(item.__isClone) // --> true
})
```

The `clones` param can be used together with `temps`, as well:

```ts
const { data } = Model.findInStore({ query: {}, clones: true, temps: true })
```

Note that any existing clones are re-used, so if you need the clone to match the latest data you need to call
`clone.reset()`, manually.

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
  Model.find({ query: { $limit: 1 } })
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
  Model.find({ query: { $limit: 1, $skip: 1 } })
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
  Model.find({ query: { $sort: { name: -1 } } })
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
  Model.find({ query: { $select: ['id', 'name'] } })
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
  Model.find({ query: { $or: [{ name: 'Bob' }, { id: 3 }] } })
  ```

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

#### $nor 🌱

`$nor` matches records that match non of the queries provided in the array.

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

  ```ts
  Model.find({ query: { $nor: [{ name: 'Bob' }, { id: 3 }] } })
  ```

  ```ts
  [
    { id: 2, name: 'Joe', age: 21 },
  ]
  ```

#### $and 🌱 🚩

`$and` matches records which match all queries provided in its array.

> 🌱 🚩 Supported by MongoDB and Knex

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

  ```ts
  Model.find({ 
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
  Model.find({ name: 'Mary' })
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
  Model.find({ name: { $in: ['Mary', 'Bob'] } })
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
  Model.find({ name: { $nin: ['Mary', 'Bob'] } })
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
  Model.find({ name: { $lt: 35 } })
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
  Model.find({ name: { $lte: 35 } })
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
  Model.find({ name: { $gt: 35 } })
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
  Model.find({ name: { $gte: 35 } })
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
  Model.find({ name: { $ne: 35 } })
  ```

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
  ]
  ```

#### $exists 🌱

`$exists` matches if the property is not `null` or `undefined` [docs](https://www.mongodb.com/docs/manual/reference/operator/query/exists/)

> 🌱 Supported by the MongoDB Adapter

  ```ts
  [
    { _id: 1, name: 'Bob' },
    { _id: 2, name: null },
    { _id: 3, name: 'Mary' },
  ]
  ```

  ```ts
  Model.find({ query: { name: { $exists: true } } })
  ```

  ```ts
  [
    { _id: 1, name: 'Bob' },
    { _id: 3, name: 'Mary' },
  ]
  ```

#### $mod 🌱

`$mod` matches where the value of a field divided by a divisor has the specified remainder. [docs](https://www.mongodb.com/docs/manual/reference/operator/query/mod/)

> 🌱 Supported by the [MongoDB Adapter](https://feathersjs.com/api/databases/mongodb.html)

  ```ts
  [
    { _id: 1, item: 'Banana', qty: 0 },
    { _id: 2, item: 'Apple', qty: 5 },
    { _id: 3, item: 'Orange', qty: 12 }
  ]
  ```

  ```ts
  Model.find({ query: { qty: { $mod: [ 4, 0 ] } } })
  ```

  ```ts
  [
    { _id: 1, item: 'Banana', qty: 0 },
    { _id: 3, item: 'Orange', qty: 12 }
  ]
  ```

#### $all 🌱

`$all` matches when an array value contains all the specified elements. [docs](https://www.mongodb.com/docs/manual/reference/operator/query/all/)

> 🌱 Supported by the [MongoDB Adapter](https://feathersjs.com/api/databases/mongodb.html)

  ```ts
  [
    { _id: 1, name: 'Bob', languages: ['English'] },
    { _id: 2, name: 'Joe', languages: ['English', 'Spanish'] },
    { _id: 3, name: 'Mary', languages: ['Spanish'] },
  ]
  ```

  ```ts
  Model.find({ query: { languages: { $all: ['Spanish', 'English'] } } })
  ```

  ```ts
  [
    { _id: 2, name: 'Joe', languages: ['English', 'Spanish'] },
  ]
  ```

#### $size 🌱

`$size` matches when the array field's length matches the provided number. [docs](https://www.mongodb.com/docs/manual/reference/operator/query/size/)

> 🌱 Supported by the [MongoDB Adapter](https://feathersjs.com/api/databases/mongodb.html)

  ```ts
  [
    { _id: 1, name: 'Bob', languages: ['English'] },
    { _id: 2, name: 'Joe', languages: ['English', 'Spanish'] },
    { _id: 3, name: 'Mary', languages: ['Spanish'] },
  ]
  ```

  ```ts
  Model.find({ query: { languages: { $size: 1 } } })
  ```

  ```ts
  [
    { _id: 1, name: 'Bob', languages: ['English'] },
    { _id: 3, name: 'Mary', languages: ['Spanish'] },
  ]
  ```

#### $regex 🌱

`$regex` matches a regular expression against a value based on matching `$options`. [docs](https://www.mongodb.com/docs/manual/reference/operator/query/regex/)

> 🌱 Supported by the [MongoDB Adapter](https://feathersjs.com/api/databases/mongodb.html)

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

  ```ts
  // Match any `name` with an "o" in it
  Model.find({ name: { $regex: 'o', $options 'igm' } })
  ```

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
  ]
  ```

#### $options 🌱

Can only be used with the `$regex` operator. See above.

> 🌱 Supported by the [MongoDB Adapter](https://feathersjs.com/api/databases/mongodb.html)

#### $not 🌱

`$not` performs a logical NOT operation on the specified query. [docs](https://www.mongodb.com/docs/manual/reference/operator/query/not/)

> 🌱 Supported by the [MongoDB Adapter](https://feathersjs.com/api/databases/mongodb.html)

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

  ```ts
  // Match any `name` without an "o" in it
  Model.find({ name: { $not: { $regex: 'o', $options 'igm' } } })
  ```

  ```ts
  [
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

#### $like 🚩

`$like` performs a case-sensitive match on values.

> 🚩 Supported by these SQL Adapters: [@feathersjs/knex](https://feathersjs.com/api/databases/knex.html#like), [feathers-objection](https://github.com/feathersjs-ecosystem/feathers-objection#default-query-operators), [feathers-sequelize](https://github.com/feathersjs-ecosystem/feathers-sequelize)

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

  ```ts
  // Match any `name` with an "o" in it
  Model.find({ name: { $like: '%o%' } })
  ```

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
  ]
  ```

#### $ilike 🚩

`$ilike` performs a case-insensitive match on values.

> 🚩 Supported by these SQL Adapters: [@feathersjs/knex](https://feathersjs.com/api/databases/knex.html#like), [feathers-objection](https://github.com/feathersjs-ecosystem/feathers-objection#default-query-operators)

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

  ```ts
  // Match any `name` with an "o" in it
  Model.find({ name: { $ilike: 'b%' } })
  ```

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
  ]
  ```

#### $iLike 🚩

See `$ilike`.

> 🚩 Supported by these SQL Adapters: [feathers-sequelize](https://github.com/feathersjs-ecosystem/feathers-sequelize)

#### $notlike 🚩

`$notlike` performs a case-sensitive negative match against values.

> 🚩 Supported by these SQL Adapters: [@feathersjs/knex](https://feathersjs.com/api/databases/knex.html#like), [feathers-sequelize](https://github.com/feathersjs-ecosystem/feathers-sequelize)

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

  ```ts
  // Match any `name` with an "o" in it
  Model.find({ name: { $notlike: 'B%' } })
  ```

  ```ts
  [
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

#### $notLike 🚩

See `$notlike`performs a case-insensitive negative match against values.

> 🚩 Supported by these SQL Adapters: [feathers-objection](https://github.com/feathersjs-ecosystem/feathers-objection#default-query-operators), [feathers-sequelize](https://github.com/feathersjs-ecosystem/feathers-sequelize)

#### $notILike 🚩

`$notILike`

> 🚩 Supported by these SQL Adapters: [feathers-objection](https://github.com/feathersjs-ecosystem/feathers-objection#default-query-operators), [feathers-sequelize](https://github.com/feathersjs-ecosystem/feathers-sequelize)

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

  ```ts
  // Match any `name` with an "o" in it
  Model.find({ name: { $notILike: 'b%' } })
  ```

  ```ts
  [
    { id: 2, name: 'Joe', age: 21 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```

#### $type

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
  Model.find({ age: { $type: Number } })
  ```

  ```ts
  [
    { id: 1, name: 'Bob', age: 42 },
    { id: 3, name: 'Mary', age: 35 },
  ]
  ```
