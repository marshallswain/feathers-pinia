---
outline: deep
---

# Migrate from Feathers-Pinia v0.x

<script setup>
import BlockQuote from '../components/BlockQuote.vue'
</script>

<BlockQuote type="danger" label="🚧 CAUTION 🚧">

If you're going to try out the pre-release, make sure you **lock the version number** in your package.json.

</BlockQuote>

Once you've installed version 2.0 (currently with `npm i feathers-pinia@pre`) you'll need to make the following changes.

## Switch to Model Functions

Since this process is very similar for Feathers-Pinia and Feathers-Vuex users, it has its own page. See the page on
[Migrating Models](/guide/migrate-models).

## Switch `handleClones` to `useClones`

Since this process is very similar for Feathers-Pinia and Feathers-Vuex users, it has its own page. See the page on
[Migrating handleClones](/guide/migrate-handle-clones).

## Don't Worry About `__isClone`

There's no need to manually remove `__isClone` or other instance metadata in hooks. They are now added as a
non-enumerable values, so they won't show up during instance serializion when prepping to send to the API server.

## No `debounceEventsMaxWait`

**TLDR:** If you were using it, replace `debounceEventsMaxWait` with `debounceEventsGuarantee`.

In order to reduce file size, we have removed lodash's debounce from the package.  Lodash's debounce supported custom intervals for guaranteed execution.  The replacement package, [just-debounce](https://npmjs.com/package/just-debounce) does not support a custom interval for guarantee. You can still guarantee execution by setting `debounceEventsGuarantee: true` in the options.  This shouldn't break any apps since the guaranteed interval will only be made shorter.

## tempIdField Not Configurable

The `tempIdField` is no longer configurable and is hard-coded to `__tempId`. When you create an instance without an
idField, a `__tempId` will automatically be assigned.

## Global State Exports Removed

Any API involving global state has been removed. This includes

- the `clients` export
- the `models` export

## Service Store Changes

- `clientAlias` has been removed.
- `servicePath` has been removed. Pass the `service` object, instead.
- `tempIdField` has been removed. The value is hard-coded to `__tempId`.
- `eventLocksById` has been renamed to `eventLocks`.
- `pendingById` has been split into several objects by method name:
  - `createPendingById`
  - `updatePendingById`
  - `patchPendingById`
  - `removePendingById`
- `afterFind` has been removed. You can use Feathers Client hooks instead.
- `state` has been removed. Use `setup` stores, instead. See [Customize the Store](/guide/use-service#customize-the-store).
- `methods` has been removed. Use `setup` stores, instead. See [Customize the Store](/guide/use-service#customize-the-store).
- `actions` has been removed. Use `setup` stores, instead. See [Customize the Store](/guide/use-service#customize-the-store).

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
// src/stores/auth.ts (new way)
import { defineStore, acceptHMRUpdate } from 'pinia'
import { useAuth } from 'feathers-pinia'

export const useAuthStore = defineStore('auth', () => {
  const { api } = useFeathers()
  const userStore = useUserStore()

  const utils = useAuth({ api, userStore })

  utils.reAuthenticate()

  return { ...utils }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot))
}
```

:::

<BlockQuote type="info">

If you're using auto-imports, there's no need to import `useAuth`.

</BlockQuote>

Here are some resources to learn more about the previous example:

- Learn more about [Auth Stores (useAuth)](/guide/use-auth)
- `useFeathers` comes from a [composable utility pattern](/guide/common-patterns#access-feathers-client)
- `useUserStore` is a [service store](/guide/use-service)
