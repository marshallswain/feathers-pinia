---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Migrate from Feathers-Pinia v0.x

Once you've installed v3 (currently with `npm i feathers-pinia@pre`) you'll need to make the following changes.

## Switch to Implicit Modeling

Since this process is very similar for Feathers-Pinia and Feathers-Vuex users, it has its own page. See the page on
[Migrating Models](/migrate/models).

## Switch Handling of Clones

Since this process is very similar for Feathers-Pinia and Feathers-Vuex users, it has its own page. See the page on
[Migrating handleClones](/migrate/handle-clones).

## Don't Worry About `__isClone`

There's no need to manually remove `__isClone` or other instance metadata in hooks. They are now added as a
non-enumerable values, so they won't show up during instance serializion when sending to the API server.

## No `debounceEventsMaxWait`

**TLDR:** If you were using it, replace `debounceEventsMaxWait` with `debounceEventsGuarantee`.

In order to reduce file size, we have removed lodash's debounce from the package.  Lodash's debounce supported custom
intervals for guaranteed execution.  The replacement package, [just-debounce](https://npmjs.com/package/just-debounce)
does not support a custom interval for guarantee. You can still guarantee execution by setting
`debounceEventsGuarantee: true` in the options.  This shouldn't break any apps since the guaranteed interval will only
be made shorter.

## tempIdField Not Configurable

The `tempIdField` is no longer configurable and is hard-coded to `__tempId`. When you create an instance without an
idField, a `__tempId` will automatically be assigned.

## Global State Exports Removed

Any API involving global state has been removed and moved into the Feathers-Pinia Client. This includes

- the `clients` export
- the `models` export

## Service Store Changes

- `clientAlias` has been removed, since the store only receives data from the Feathers Client.
- `servicePath` has been removed, since the store only receives data from the Feathers Client.
- `service` has been removed, since the store only receives data from the Feathers Client.
- `tempIdField` has been removed. The value is hard-coded to `__tempId`.
- `eventLocksById` has been renamed to `eventLocks`.
- `pendingById` has been split into several objects by method name:
  - `createPendingById`
  - `updatePendingById`
  - `patchPendingById`
  - `removePendingById`
- `afterFind` has been removed. You can use Feathers Client hooks instead.
- `state` has been removed. Use [Store Composition](/guide/common-patterns#custom-pinia-stores)
- `methods` has been removed. Use [Store Composition](/guide/common-patterns#custom-pinia-stores)
- `actions` has been removed. Use [Store Composition](/guide/common-patterns#custom-pinia-stores)

## No More `defineAuthStore`

The `useAuth` utility is the replacement for `defineAuthStore`.  It's much more powerful and flexible.

::: code-group

```ts [defineAuthStore (old)]
// src/stores/auth.ts (old way)
import { defineAuthStore } from 'feathers-pinia'
import { api as feathersClient } from '~/feathers'

export const useAuth = defineAuthStore({
  feathersClient,
})
```

```ts [useAuth (new)]
import { useAuth } from 'feathers-pinia'
// src/stores/auth.ts (new way)
import { acceptHMRUpdate, defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const { api } = useFeathers()
  const utils = useAuth({ api, servicePath: 'users' })

  utils.reAuthenticate()

  return { ...utils }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot))
```

:::

<BlockQuote type="info">

If you're using auto-imports, there's no need to import `useAuth`.

</BlockQuote>
