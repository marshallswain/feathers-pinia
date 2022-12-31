---
outline: deep
---

# Service Stores - useService

<script setup>
import BlockQuote from '../components/BlockQuote.vue'
</script>

[[toc]]

In Feathers-Pinia 2.0, the `defineStore` utility has been replaced by the `useService` Composition API utility.

## useService

The `useService` utility gives you a Feathers-service enabled store which can be easily customized:

```ts
// src/store/users.ts
import { defineStore, acceptHMRUpdate } from 'pinia'
import { useService } from 'feathers-pinia'
import { User } from '../models'

export const useUserStore = defineStore('users', () => {
  const { $api } = useFeathers()
  const service = $api.service('messages')

  const utils = useService({
    service,
    idField: 'id',
    Model: User,
  })

  return { ...utils }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
}
```

## Options

Here's a look at the `UseServiceOptions` interface. An explanation of each follows this code snippet:

```ts
import { Application as FeathersClient } from '@feathersjs/feathers'

interface UseServiceOptions<
  M extends AnyData, 
  D extends AnyData, 
  Q extends Query, 
  ModelFunc extends (data: ModelInstance<M>) => any
> {
  service: FeathersClientService<FeathersInstance<M, Q>, D, Params<Q>>
  idField: string
  Model: ModelFunction
  whitelist?: string[]
  paramsForServer?: string[]
  skipRequestIfExists?: boolean
  ssr?: MaybeRef<boolean>
  handleEvents?: HandleEvents<M>
  debounceEventsTime?: number
  debounceEventsGuarantee?: boolean
}

interface HandleEvents {
  created?: Function
  patched?: Function
  updated?: Function
  removed?: Function
}
```

Here are a few more details about each option:

- **`service {FeathersClientService}`** the Feathers Client service object. **_required_**
- **`idField {String}`** is the attribute on the record that will serve as the unique identifier or "primary key" in the
database.
- **`Model {ModelFunction}`** is the class to use for each instance. See [Model Functions](/guide/model-functions)
- **`whitelist`** is an array of keys to allow in the `findInStore` getter's `params.query` object.
- **`paramsForServer`** is an array of query keys for `findInStore` to ignore and pass to the `find` action's query.
- **`skipRequestIfExists {Boolean}`** when enabled will cause a `.get` request to automatically resolve with the stored
record with matching id, if one exists. If not, the request will be made as normal.
- **`ssr {Boolean}`** indicates if Feathers-Pinia is loading in an SSR environment. Paginated queries made during SSR
will be marked with `ssr: true`. When a matching request is made on the client (when `ssr` is false) the store data will
be used and the request will not be remade.
- **`handleEvents {Object}`** is an object that lets you customize how realtime events are handled. Each key is a name of a realtime event handler function: `created`, `patched`, `updated`, or `removed`. You can provide your own handler to customize and override individual events.
- **`debounceEventsTime {Number}`** determines how long to wait until flushing a batch of events. Defaults to `20`. If no events have been received in a 20 millisecond period, all gathered events will be processed.
- **`debounceEventsGuarantee {Boolean}`** forces accumulated events to flush every `debounceEventsTime` interval. Off by default.

## Returned API

The object returned from `useService` is built on top of the BaseModel store. Refer to the
[BaseModel store documentation](/guide/use-base-model-stores) for API details. The following sections will cover store
APIs not in the BaseModel store.

The following sections cover additional APIs returned when calling `useService`. APIs are grouped by functionality.

### Additional State

- **`service`**
- **`paramsForServer`**
- **`skipRequestIfExists`**
- **`isSsr`**
- **`Model`** gives access to the Model Function provided in the options.

### Pagination State

- **`pagination`** keeps track of the latest pagination data for each paginated request to the server. You generally
won't manually modify this.
- **`updatePaginationForQuery()`**
- **`unflagSsr()`**

### Pending State

- **`isPending`**
- **`createPendingById`** keeps track of individual records, by id, that have pending `create` requests.
- **`updatePendingById`** keeps track of individual records, by id, that have pending `update` requests.
- **`patchPendingById`** keeps track of individual records, by id, that have pending `patch` requests.
- **`removePendingById`** keeps track of individual records, by id, that have pending `remove` requests.
- **`isFindPending`** is a boolean computed which will be true if any `find` request is pending.
- **`isCountPending`** is a boolean computed which will be true if any `count` request is pending.
- **`isGetPending`** is a boolean computed which will be true if any `get` request is pending.
- **`isCreatePending`** is a boolean computed which will be true if any `create` request is pending.
- **`isUpdatePending`** is a boolean computed which will be true if any `update` request is pending.
- **`isPatchPending`** is a boolean computed which will be true if any `patch` request is pending.
- **`isRemovePending`** is a boolean computed which will be true if any `remove` request is pending.
- **`setPending()`** allows setting a method as pending.
- **`setPendingById()`** allows setting a record as pending by method name and record id.
- **`unsetPendingById()`** allows unsetting a record's pending status.
- **`clearAllPending()`** resets pending state back to its original, empty state.

### Event Locks

Event locks are automatically managed and require no manual upkeep.

- **`eventLocks`** helps prevent receiving normal, duplicate responses from the API server during CRUD actions. Instead of processing both the CRUD response AND the realtime event data, it only handles one of them.
- **`toggleEventLock()`** used to toggle an event lock.
- **`clearEventLock()`** used to turn off an event lock

### Service Methods

Service methods are convenience wrappers around the Feathers Client service provided in the options.

#### `find(params)`

Uses the Feathers Client to retrieve records from the API server. On an SSR server, find data will be marked as `ssr: true`, which allows extra queries to be skipped on the client.

```vue
<script setup>
import { useTodos } from '../store/todos'

const todoStore = useTodos()

todoStore.find({ query: {} }).then(/* ... */)
</script>
```

#### `count(params)`

Like `find`, but returns the number of records that match the query. It does not return the actual records.

```vue
<script setup lang="ts">
import { useTodos } from '../store/todos'
const todoStore = useTodos()

await todoStore.count({ query: { isComplete: false } })
</script>
```

#### `get(id, params)`

Uses the Feathers Client to retrieve a single record from the API server.

```vue
<script setup lang="ts">
import { useTodos } from '../store/todos'
const todoStore = useTodos()

await todoStore.get(1)
</script>
```

#### `update(id, data, params)`

Uses the Feathers Client to send an `update` request to the API server.

```vue
<script setup lang="ts">
import { useTodos } from '../store/todos'
const todoStore = useTodos()

await todoStore.update(1, { description: 'foo', isComplete: true })
</script>
```

#### `patch(id, data, params)`

Uses the Feathers Client to send an `patch` request to the API server.

```vue
<script setup lang="ts">
import { useTodos } from '../store/todos'
const todoStore = useTodos()

await todoStore.patch(1, { isComplete: true })
</script>
```

#### `remove(id, params)`

Uses the Feathers Client to send a `remove` request to the API server.

```vue
<script setup lang="ts">
import { useTodos } from '../store/todos'
const todoStore = useTodos()

await todoStore.remove(1)
</script>
```

### Service Utils

These utilities use a combination of multiple store methods to eliminate boilerplate and improve developer experience.

- [useFind()](/guide/use-find)
- [useGet()](/guide/use-get)
- `useGetOnce()` has the same API as [useGet](/guide/use-get), but only queries once per record.
- [useFindWatched()](/guide/use-find-watched)
- [useGetWatched()](/guide/use-get-watched)

## Customize the Store

You can customize the store by changing the values that are returned. This contrived example shows how you can return
additional values.

```ts
// src/store/users.ts
import { defineStore, acceptHMRUpdate } from 'pinia'
import { useService } from 'feathers-pinia'
import { User } from '../models'

export const useUserStore = defineStore('users', () => {
  const { $api } = useFeathers()
  const service = $api.service('messages')

  const utils = useService({
    service,
    idField: 'id',
    Model: Task,
  })
  const myCustomState = false

  return { ...utils, myCustomState }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
}
```

<BlockQuote label="Warning" type="warning">

It's possible to overwrite store attributes if you provide a variable after the `...utils` spread and that variable has
the same name as a key returned by `utils`.  This example return would overwrite the `find` method as a boolean:

```ts
// oops, I broke `find`
return { ...utils, find: true }
```

Conversely, if you provide the conflicting variable before the `...utils` spread, the value will be overwritten by the
one returned from `utils`:

```ts
// utils.find overwrites the find boolean, since it's declared last.
return { find: true, ...utils }
```

</BlockQuote>

## Server Side Rendering (SSR)

Both Pinia and Feathers-Pinia require to be configured to work with SSR.

- **Pinia takes care of SSR Hydration**, making sure the data on the server is transferred to the client.
- **Feathers-Pinia prevents duplicate requests** with proper reutilization of server-fetched and hydrated data.

### Pinia SSR

SSR hydration is done at the Pinia level, which makes SSR a breeze with any SSR server. The Pinia docs include two section on SSR:

- [SSR with Vue + Vite](https://pinia.vuejs.org/ssr/)
- [SSR with Nuxt.js](https://pinia.vuejs.org/ssr/nuxt.html)

Be sure to follow the instructions that most closely match your setup.

### Feathers-Pinia SSR

The only real requirement to get SSR working is to properly provide the `ssr` option to be `true` on the server and
`false` on the client. The correct way to do this will vary depending on the environment. Some environments will work
by using `!!process.server`. Other environments might use a different variable to indicate SSR or client. You'll need
to get that information from your SSR framework.

Here's an example of a setup that uses `process.server`.

```ts
export const useUserStore = defineStore('users', () => {
  const { $api } = useFeathers()
  const service = $api.service('messages')

  const utils = useService({
    service,
    idField: 'id',
    Model: Task,
    ssr: !!process.server
  })

  return { ...utils }
})
```

Once the `ssr` option is set correctly on the server and client, SSR should just work!

### Automatic Instance Hydration

🚧 This section requires updating after app examples are completed. 🚧

Normally, during SSR, after the rendered page has been delivered to the client, the browser takes any inline JSON
payload and pushes it into the store. This is called hydration. The problem is that basic hydration does not assure that
records are Model instances. You'll recognize the problem when the browser throws an error like this:

```text
Error: object has no method named `.save()`
```

That's because plain objects don't actually have a `save()` method. Only once it has been turned back into a Model
instance does it have a `save()` method. So we need to make sure that data is fully hydrated into an actual instance
before using its methods.

Instead of automatically hydrating every instance in the store, Feathers-Pinia uses a more performant rule: Only hydrate
the instances actually in use. It achieves this through the Query Getters. Any plain record returned by
`store.findInStore` or `store.getFromStore` will automagically be turned into a fully hydrated model instance.
