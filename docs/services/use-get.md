---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# The `useGet` Method

[[toc]]

The `useGet` method takes the work out of watching an "id" variable and retrieving individual records from the API
server.

## Overview of Features

- **Auto-Updating** - change the `id` and it does the rest.
- **Fall-Through Cache** - Always pulls from the store while new data is fetched.
- **Easy Request State** - Pending request state is built in.
- **SSR Friendly** - Data can load on the server and hydrate on the client.

## Usage

You can call `useGet` directly from the store. the advantage being that you don't have to provide the `store` in the params, as shown here:

```ts
interface Props {
  id: string | number
}
const props = defineProps<Props>()

const { api } = useFeathers()
const id = computed(() => props.id)

const user$ = api.service('users').useGet(id)
```

For a client-only solution, you can just use the `getFromStore` method:

```ts
interface Props {
  id: string | number
}
const props = defineProps<Props>()

const { api } = useFeathers()
const id = computed(() => props.id)

const user = api.service('users').getFromStore(id)
```

## API

### useGet(id, params)

- **`id` {MaybeRef string | number}** the id of the record to retrieve. Can be a computed/ref to enable automatic updates to the returned `data`.
- **`params` {Object}** a combined Feathers `Params` object and set of options for configuring behavior of `useGet`.
  - **`query` {Object}** a Feathers query object.
  - **`clones` {Boolean}** returns result as a clone. See [Querying Data](/data-stores/querying-data#local-params-api)
  - **`temps` {Boolean}** enables retrieving temp records. See [Querying Data](/data-stores/querying-data#local-params-api)
  - **`watch` {boolean}** can be used to disable the watcher on `id`
  - **`immediate` {boolean}** can be used to disable the initial request to the API server.

### Returned Object

- **`id` {Ref number | string}** is a ref version of the `id` that was provided as the first argument to `useGet`. Modifying `id.value` will cause the `data` to change.
- **`params` {Params}** is a ref version of the params. Params are not currently watched for `useGet`.
- **`data` {Computed Object}** the record returned from the store.
- **`ids` {Ref Array}** is a list of ids that have been retrieved from the API server, in chronological order. May contain duplicates.
- **`get` {Function}** similar to `store.get`. If called without any arguments it will fetch/re-fetch the current `id`. Accepts no arguments.
- **`request` {Promise}** stores the current promise for the `get` request.
- **`requestCount` {Ref number}** a counter of how many requests to the API server have been made.
- **`getFromStore` {Function}** the same as `store.getFromStore`.
- **`isPending` {Computed boolean}** returns true if there is a pending request. While true, the `data` will continue to hold the most recently-fetched record.
- **`hasBeenRequested` {Computed boolean}** returns true if any record has been requested through this instance of `useGet`. It never resets.
- **`hasLoaded` {Computed boolean}** is similar to `isPending` but with different wording.
- **`error` {Computed error}** will display any error that occurs. The error is cleared if another request is made or if `clearError` is called.
- **`clearError` {Function}** can be used to manually clear the `error`.

### Only Query Once Per Record

The simplest way to only query once per record is to set the `skipGetIfExists` option to `true` during configuration.

You can also use the `useGetOnce` method to achieve the same behavior for individual requests.
