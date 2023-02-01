---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import pkg from '../../package.json'
import BlockQuote from '../components/BlockQuote.vue'
</script>

<div style="position: fixed; z-index: 1000; top: 2px; right: 2px;">
  <Badge :label="`v${pkg.version}`" />
</div>

# BaseModel Stores

[[toc]]

Model Functions come with their own built-in stores. The BaseModel store API is a subset of the FeathersModel store.

**Related reading:**

- [BaseModel Static API](/guide/use-base-model)
- [BaseModel Instance API](/guide/use-base-model-instances)

## Creating a BaseModel Store

BaseModel stores are created only when you create a BaseModel Function using [useBaseModel](/guide/use-base-model). The
default store is found at `Model.store`:

<!--@include: ./notification-feathers-client.md-->

```ts
import type { Tasks, TasksData, TasksQuery } from 'my-feathers-api'
import { type ModelInstance, useBaseModel, useInstanceDefaults } from 'feathers-pinia'

const modelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({ description: '', isComplete: false }, data)
  return withDefaults
}
const Task = useBaseModel<Tasks, TasksQuery, typeof modelFn>({ name: 'Task', idField: '_id' }, modelFn)

console.log(Task.store) // --> See API, below
```

Similar to a Pinia store, the top-level of the store is a `reactive`, which means nested `computed` properties will be
unwrapped, which means you don't have to access their contents using `.value`, like you would with a Vue `ref` or
`computed`, normally.

## API

Here is the API for BaseModel stores, grouped by functionality.

### Items

Items are records which have an idField, which is usually assigned by a server, though not required.

- `itemsById` is an object used as the storage for items. They are keyed by idField to allow for quick lookup.
- `items` is a dynamically-computed array which holds the list of all records in `itemsById`.
- `itemIds` is a dynamically-computed array which holds all keys in `itemsById`.

### Temps

Temporary records ("temps" for short) are records which are not created with an idField. They are automatically assigned
a `__tempId` during creation.

- `tempsById` is an object used as the storage for temps. They are keyed by `__tempId` to allow for quick lookup.
- `temps` is a dynamically-computed array which holds the list of all records in `tempsById`.
- `tempIds` is a dynamically-computed array which holds all keys in `tempsById`.

### Clones

Clones are copies of stored data from either `items` or `temps`. They have either an idField or a `__tempId`.

- `clonesById` is an object used as the storage for clones. They are keyed by `__cloneId` to allow for quick lookup.
- `clones` is a dynamically-computed array which holds the list of all records in `clonesById`.
- `cloneIds` is a dynamically-computed array which holds all keys in `clonesById`.
- `clone(itemOrTemp)` creates a copy of the `itemOrTemp` and stores it in `clonesById`.
- `commit(clone)` copies the keys from the provided `clone` onto its original record in `items` (or `temps`).
- `reset(clone)` makes the `clone` match the original record in `items` (or `temps`).

### Storage

The storage APIs include methods for adding data to and removing data from the internal storage. All of the below
methods except `clearAll` are also aliased directly on the Model. The `clearAll` method is not aliased to make it
explicitly obvious that you are clearing the store by calling `Model.store.clearAll()`.

- `findInStore(params)` returns records from the store matching `params.query`. The response is synchronous and always
returns a results object with an array of `data`. Paginated responses also include `limit`, `skip`, and `total`. If you
turn off pagination, only `{ data }` will be returned.
- `countInStore(params)` returns the number of records in the store which match `params.query`.
- `getFromStore(id, params)` returns the record from the store with matching `id`, or returns `null` if a record is not
found.
- `addToStore(data)` adds the data object or array to the correct internal storage (items or temps), depending on if an
idField is present.
- `removeFromStore(data)` removes any data with matching `data[idField]` from the store. `data` can be an object or an
array of objects.
- `clearAll()` removes all stored `items`, `temps`, and `clones` from the store.

### Internal State

- `idField` will match the `idField` option that you provided in the Model options.
- `associations` stores a reference to each `associateFind` or `associateGet` relationship.
- `whitelist` will match the `whitelist` option that you provided in the Model options. The `whitelist` marks special
query operators and filters to be allowed in store queries.
