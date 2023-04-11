---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Standalone Data Stores

[[toc]]

## Creating a Data Store

<!--@include: ./notification-feathers-client.md-->

```ts
import { useDataStore } from 'feathers-pinia'
import { createPinia, defineStore } from 'pinia'

const pinia = createPinia()

const useStore = defineStore('custom-tasks', () => {
  const utils = useDataStore({
    idField: 'id',
    customSiftOperators: {}
    setupInstance: (data: any, { api, service, servicePath }) => data
  })
  return { ...utils }
})
const store = useStore(pinia) // --> See API, below

// Adds HMR support
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStore, import.meta.hot))
}
```

Similar to a Pinia store, the top-level of the store is a `reactive`, which means nested `computed` properties will be
unwrapped, which means you don't have to access their contents using `.value`, like you would with a Vue `ref` or
`computed`, normally.

### Options

- `idField` is the name of the unique identifier attribute on each record.
- `customSiftOperators` is an optional object containing [sift](https://github.com/crcn/sift.js/) operators for using
custom operators to query store data with `findInStore`.
- `setupInstance` is a function that receives the instance data and allows you to customize it before returning it.

## API

Here is the Data Stores API, grouped by functionality.

### Items

Items are records which have an unique idField.

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

- `findInStore(params) => { data, limit, skip, total }` returns records from the store matching `params.query`. The
response is synchronous and always returns a results object with an array of `data`. Paginated responses also include
`limit`, `skip`, and `total`. If you turn off pagination, only `{ data }` will be returned. All returned properties are
computed properties.
- `findOneInStore(params) => Computed<Record>` returns the first record that matches `params.query`. The response is synchronous and returns
an object.
- `countInStore(params) => Computed<number>` returns the number of records in the store which match `params.query`.
- `getFromStore(id, params) => Computed<Record>` returns the record from the store with matching `id`, or returns `null`
if a record is not found.
- `createInStore(data)` adds the data object or array to the correct internal storage (items or temps), depending on if
an idField is present.
- `patchInStore(idOrItems, data)` updates each of the provided items or items that match the ids with the provided data.
- `removeFromStore(idOrItems, params)` removes provided items or items that match provided ids from the store. You can
also pass `null` as the first argument and remove items based on a query.
- `clearAll()` removes all stored `items`, `temps`, and `clones` from the store.

### Internal State

- `idField` will match the `idField` option that you provided in the Model options.
- `isSsr` exists as a utility attribute which can be used in custom store getters and actions.
