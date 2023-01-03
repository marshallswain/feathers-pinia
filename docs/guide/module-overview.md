---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Module Overview

[[toc]]

<BlockQuote label="Pending Removal in 2.0" type="danger">

These APIs will be removed before publishing version 2.0:

- `setupFeathersPinia` formerly used for global configuration. It has no replacement since it's no longer necessary with the new `useService` API.
- [defineStore](/guide/service-stores) formerly used to create Pinia stores. Replaced with the `useService` API.
- [BaseModel classes](/guide/base-model) was formerly the base class for data modeling. It's replaced by `useFeathersModel` and `useBaseModel` and Model Functions.
- global `clients` export
- global `models` export

</BlockQuote>

## Setup & Store Creation

These are the primary utilities for creating stores.

```ts
// Setup & Store Creation
export { useService } from './use-service'
export { useAuth } from './use-auth'
export { feathersPiniaHooks } from './hooks'
```

- [useService](/guide/use-service) is a composition for creating service stores.
- [useAuth](/guide/use-auth) is a composition utility which allows you to create a highly-flexible setup stores for auth.
- [feathersPiniaHooks](/guide/hooks) adds feathers-pinia hooks to a Feathers Client service.

## Composition API Utils

<Badge>New APIs in v1</Badge>

```ts
// Composition API Utils
export { useFind } from './use-find'
export { useGet } from './use-get'
export { useClone } from './use-clone'
export { useClones } from './use-clones'
```

- [useFind](/guide/use-find) is a utility that assists you in implementing the Live Query pattern. Give it a set of params and you'll get back live-updating lists of `data`, as well as pagination utilities like `next`, and `prev`. It's super versatile, handling declarative and imperative workflows that support both the client- and server-side pagination. It's similar to SWR but far more intelligent, being able to reuse data between different queries.
- [useGet](/guide/use-get) is similar to `useFind` but for the `get` method.
- [useClone](/guide/use-clones) is like `useClones` but for a single prop.
- [useClones](/guide/use-clones) removes boilerplate from the [clone and commit pattern](/guide/common-patterns.html#clone-and-commit-pattern). It automatically clones all component props containing a `feathers-pinia` instance.

## Data Modeling & Associations

```ts
// Data Modeling & Associations
export { useBaseModel, useFeathersModel } from './use-base-model'
export { associateFind } from './associate-find'
export { associateGet } from './associate-get'
```

- [useFeathersModel](/guide/use-feathers-model) creates Model functions fully connected to a Feathers service.
- [useBaseModel](/guide/use-base-model) creates Model functions for standalone data, optionally connected to a Feathers service.
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

## Feathers-Vuex Migration Utils

```ts
// Feathers-Vuex Migration Utils
export { useFindWatched } from './use-find-watched'
export { useGetWatched } from './use-get-watched'
export { usePagination } from './use-pagination'
```

These utilities exist to assist with migration from Feathers-Vuex. Use them for migrating existing Feathers-Vuex code, but not for new development. Use the new `useFind` and `useGet` utilities for new development.

- **`useFindWatched`** is the equivalent to Feathers-Vuex's `useFind` utility. See [useFindWatched](./use-find-watched)
- **`useGetWatched`** is the equivalent to Feathers-Vuex's `useGet` utility. See [useGetWatched](./use-get-watched).
- **`usePagination`** is a composition api utility that handles typical pagination logic. See [usePagination](./use-pagination)
