---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Sync with Storage

Improve perceived app speed by storing some data client-side.

[[toc]]

A super-lightweight utility for syncing with `localStorage` (or any `Storage` interface) is built into Feathers-Pinia.
The internal `syncWithStorage` utility watches for changes in specified keys in the store and writes the changes to
localStorage. Other features include:

- Can be enabled for the entire `api` instance or individual services.
- Only caches `itemsById` and `pagination` attributes, by default.
- Allows passing custom keys to sync. This is globally configurable or customizable per service.

The typical use case for this would be to speed up the perceived speed of Single Page Applications. The data hydrates
so quickly that a SPA will feel like a server-rendered application. After any write to the store, the provided keys will
be serialized into `localStorage` after a 500ms period of inactivity.

## Examples

### Sync All Service Data

Here's how to set it up for the entire Feathers-Pinia client instance:

```ts
export const api = createPiniaClient(feathersClient, {
  idField: '_id',
  pinia,
  syncWithStorage: true,
  storage: window.localStorage,
})
```

Note that you must provide the global-only `storage` option AND the `syncWithStorage` option to enable the feature.

### Sync Individual Service Data

Here's how to enable storage sync for a single service:

```ts
export const api = createPiniaClient(feathersClient, {
  idField: '_id',
  pinia,
  syncWithStorage: false,
  storage: window.localStorage,
  services: {
    'my-service': {
      syncWithStorage: true
    }
  }
})
```

### Customize Storage Keys

You can customize which store keys are synchronized to storage by passing an array to `syncWithStorage`. You must
provide all keys, since this will override the default value, which is `['itemsById', 'pagination']`.

```ts
export const api = createPiniaClient(feathersClient, {
  idField: '_id',
  pinia,
  syncWithStorage: ['itemsById', 'pagination', 'tempsById'],
  storage: window.localStorage,
})
```

## `syncWithStorage` Utility

The `syncWithStorage` utility is also available to use with any Pinia store, including Feathers-Pinia data stores. Here
is an example:

```ts
import { syncWithStorage, useDataStore } from 'feathers-pinia'
import { createPinia, defineStore } from 'pinia'

const pinia = createPinia()

const useStore = defineStore('custom-tasks', () => {
  const utils = useDataStore({
    idField: 'id',
    customSiftOperators: {},
    setupInstance: (data: any, { api, service, servicePath }) => data
  })
  return { ...utils }
})
const store = useStore(pinia) // --> See API, below

syncWithStorage(store, ['itemsById', 'pagination'], window.localStorage)
```

### API

The `syncWithStorage` utility accepts three arguments:

- `store` The initialized pinia `store` **required**
- `keys[]`An array of strings representing the keys whose values should be cached. **required**
- `storage{}` an object conforming to the `Storage` interface (same as `localStorage`, `sessionStorage`, etc. **optional: defaults to `localStorage`**

## Clear Storage

If you configured a storage adapter, you can clear all service data from storage by calling `api.clearStorage()`.

```ts
api.clearStorage()
```

There is also a standalone utility:

```ts
import { clearStorage } from 'feathers-pinia'

clearStorage(window.localStorage)
```
