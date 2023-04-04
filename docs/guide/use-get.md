---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# The `useGet` Utility

[[toc]]

The `useGet` function is a Vue Composition API utility that takes the work out of retrieving individual records from the store or API server.

## Overview of Features

- **Stored Data or Server Data** - it works with either as the source.
- **Auto-Updating** - change the `id` and it does the rest.
- **Fall-Through Cache** - Always pulls from the store while new data is fetched.
- **Easy Request State** - Pending request state is built in.
- **SSR Friendly** - Data can load on the server and hydrate on the client.

## Usage

There are two ways to use `useGet`: from the store (recommended) or standalone.

### Recommended

You can call `useGet` directly from the store. the advantage being that you don't have to provide the `store` in the params, as shown here:

```ts
import { useUsers } from '../store/users'

interface Props {
  id: string | number
}
const props = defineProps<Props>()
const userStore = useUsers()

// client-only example
const { data: user } = userStore.useGet(props.id)

// onServer example
const { data: user, isPending, error } = userStore.useGet(props.id, { onServer: true })
```

### Standalone

In standalone mode, you have to import `useGet` and provide the `store` option in the params object, as shown here:

```ts
import { useUsers } from '../store/users'
import { useGet } from 'feathers-pinia'

interface Props {
  id: string | number
}
const props = defineProps<Props>()
const userStore = useUsers()

// client-only example
const { data: user } = useGet(props.id, { store: userStore })

// onServer example
const { data: user, isPending, error } = useGet(props.id, { store: userStore, onServer: true })
```

## API

### useGet(id, params)

- **`id` {MaybeRef string | number}** the id of the record to retrieve. Can be a computed/ref to enable automatic updates to the returned `data`.
- **`params` {Object}** a combined Feathers `Params` object and set of options for configuring behavior of `useGet`.
  - **`query` {Object}** a Feathers query object.
  - **`store` {Store}** the Feathers-Pinia service store
  - **`clones` {Boolean}** returns result as a clone. See [Querying Data](/guide/querying-data#local-params-api)
  - **`temps` {Boolean}** enables retrieving temp records. See [Querying Data](/guide/querying-data#local-params-api)
  - **`onServer` {boolean}** sets up a watcher on `id` that sends API requests when id changes.
  - **`watch` {boolean}** can be used to disable the watcher on `id` while `onServer` is true.
  - **`immediate` {boolean}** can be used to disable the initial request to the API server while `onServer` is true.

### Returned Object

- **`id` {Ref number | string}** is a ref version of the `id` that was provided as the first argument to `useGet`. Modifying `id.value` will cause the `data` to change.
- **`params` {Params}** is a ref version of the params. Params are not currently watched for `useGet`.
- **`store` {Store}** the Feathers-Pinia service store
- **`data` {Computed Object}** the record returned from the store. When `onServer` is provided in the `params`, the data will be automatically retrieved from the API server, but always returned from the store.
- **`ids` {Ref Array}** is a list of ids that have been retrieved from the API server, in chronological order. May contain duplicates.
- **`get` {Function}** similar to `store.get`, but if called without any arguments it will fetch/re-fetch the current `id`.
- **`request` {Promise}** stores the current promise for the `get` request.
- **`requestCount` {Ref number}** a counter of how many requests to the API server have been made.
- **`getFromStore` {Function}** the same as `store.getFromStore`.
- **`isPending` {Computed boolean}** returns true if there is a pending request. While true, the `data` will continue to hold the most recently-fetched record.
- **`hasBeenRequested` {Computed boolean}** returns true if any record has been requested through this instance of `useGet`. It never resets.
- **`hasLoaded` {Computed boolean}** is similar to `isPending` but with different wording.
- **`error` {Computed error}** will display any error that occurs. The error is cleared if another request is made or if `clearError` is called.
- **`clearError` {Function}** can be used to manually clear the `error`.

## Examples

### Only Query Once Per Record

See the example on the [Common Patterns](./common-patterns#query-once-per-record) page.
