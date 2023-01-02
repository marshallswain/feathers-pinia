---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
import V2Block from '../components/V2Block.vue'
</script>

<V2Block />

# Module Overview

[[toc]]

The main module features the following exports:

## Setup & Store Creation

```ts
// Setup & Store Creation
export { setupFeathersPinia } from './setup'
export { defineStore } from './service-store'
export { useAuth } from './use-auth'
```

- **`setupFeathersPinia`** allows global configuration of `clients` for all apps. It can also be used to support a common set of options for the returned, wrapped `defineStore` function. Right now it's not that useful for SSR apps, which require an alternative configuration.
- [defineStore](/guide/service-stores) sets up a Pinia store for a Feathers service.
- [useAuth](/guide/use-auth) is a composition utility which allows you to create a highly-flexible setup stores for auth.

## Composition API Utils

<Badge>New APIs in v1</Badge>

```ts
// Composition API Utils
export { useFind, Find } from './use-find'
export { useGet, Get } from './use-get'
export { useClones } from './use-clones'
export { useClone } from './use-clone'
```

- [useFind](/guide/use-find) is a utility that assists you in implementing the Live Query pattern. Give it a set of params and you'll get back live-updating lists of `data`, as well as pagination utilities like `next`, and `prev`. It's super versatile, handling declarative and imperative workflows that support both the client- and server-side pagination. It's similar to SWR but far more intelligent, being able to reuse data between different queries.
- [useGet](/guide/use-get) is similar to `useFind` but for the `get` method.
- [useClones](/guide/use-clones) removes boilerplate from the [clone and commit pattern](/guide/common-patterns.html#clone-and-commit-pattern). It automatically clones all component props containing a `feathers-pinia` instance.
- [useClone](/guide/use-clones) is like `useClones` but for a single prop.

## Data Modeling & Associations

```ts
// Data Modeling & Associations
export { BaseModel } from './service-store'
export { associateFind } from './associate-find'
export { associateGet } from './associate-get'
```

- [BaseModel](/guide/base-model) is the base class for working with [Data Modeling](./model-classes).
- [associateFind](/guide/associate-find) creates an array-based relationship with another Model class
- [associateGet](/guide/associate-get) creates a single-object-based relationship with another Model class

## SSR & Storage

```ts
// SSR & Storage
export { OFetch } from './feathers-ofetch'
export { syncWithStorage } from './storage-sync'
export { clearStorage } from './clear-storage'
```

- [`OFetch`](/guide/ofetch) is a utility that combines the universal fetch utility called [ofetch](https://github.com/unjs/ofetch) with the Feathers-Client. It enables compatibility with Nuxt3 with SSR enabled.
- **`syncWithStorage`** synchronizes specific parts of a store's state into `localStorage` or any [Storage-compatible](https://developer.mozilla.org/en-US/docs/Web/API/Storage) adapter you provide.
- **`clearStorage`** clears data stored with the above utilities.

Learn more about these utilities in [syncWithStorage](./storage-sync)

## Global Reference Objects

```ts
// Global Reference Objects
export { models } from './models'
export { clients, registerClient } from './clients'
```

- **`clients`** stores a reference to every Feathers client provided to either `setupFeathersPinia` or `defineStore`.

  - After setup, you can reference a `FeathersClient` at any time as shown below. This might come in handy if you need to fetch data that you don't want to be reactive. That data also won't end up in the store, so it would require refetching if not manually stored somewhere. You could use this with [swrv](https://docs-swrv.netlify.app/).

  ```ts
  import { clients } from 'feathers-pinia'
  const { api } = clients

  const result = await api.service('items').find({ query: {} })
  ```

- If you call your default client `api`, you won't have to provide a custom `clientAlias` option to the `defineStore` function. Learn about setting up FeathersClient instances in [Setup](./setup).
- **`registerClient`** adds a client by name to the `clients` object.  `registerClient('api', feathersClientInstance)`.

- **`models`** stores a reference to every custom model provided to `defineStore`.

## Feathers-Vuex Migration Utils

```ts
// Feathers-Vuex Migration Utils
export { defineAuthStore } from './define-auth-store'
export { useFindWatched } from './use-find-watched'
export { useGetWatched } from './use-get-watched'
export { usePagination } from './use-pagination'
```

These utilities exist to assist with migration from Feathers-Vuex. Use them for migrating existing Feathers-Vuex code, but not for new development. Use the new `useFind` and `useGet` utilities for new development.

- **`defineAuthStore`** sets up a single Pinia store for an authentication service. See [Auth Stores](./auth-stores)
- **`useFindWatched`** is the equivalent to Feathers-Vuex's `useFind` utility. See [useFindWatched](./use-find-watched)
- **`useGetWatched`** is the equivalent to Feathers-Vuex's `useGet` utility. See [useGetWatched](./use-get-watched).
- **`usePagination`** is a composition api utility that handles typical pagination logic. See [usePagination](./use-pagination)
