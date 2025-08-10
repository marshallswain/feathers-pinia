---
outline: deep
---

# Service Stores

[[toc]]

## Setup

We learned the basics of [how to create service stores](./setup#service-stores) on the setup page. Let's cover the topic in more detail.

## Using `defineStore`

Here's a look at the `DefineStoreOptions` interface. By the way, there's lots of room for TypeScript improvements in the codebase. Pull Requests are very much encouraged!

```ts
import { Application as FeathersClient } from '@feathersjs/feathers'

interface DefineStoreOptions {
  ssr?: boolean // New in 0.24.0
  servicePath: string
  Model?: any
  idField?: 'id' | '_id' | string
  tempIdField?: '__tempId' | string
  id?: string
  clientAlias?: 'api' | string
  clients?: { [alias: string]: FeathersClient }
  handleEvents?: HandleEvents
  enableEvents?: boolean
  debounceEventsTime?: number
  debounceEventsMaxWait?: number
  whitelist?: string[]
  paramsForServer?: string[]
  state?: () => { [k: string]: any }
  getters?: { [k: string]: (state: any) => any }
  actions?: { [k: string]: (args) => any }
}
interface HandleEvents {
  created?: (data: any) => boolean
  patched?: (data: any) => boolean
  updated?: (data: any) => boolean
  removed?: (data: any) => boolean
}
```

Here are a few more details about each option:

- **`ssr {Boolean}`** indicates if Feathers-Pinia is loading in an SSR environment. Paginated queries made during SSR will be marked with `ssr: true`.
- **`servicePath {String}`** is the same as the Feathers service path. **_required_**
- **`Model {ModelClass}`** is the class to use for each instance. If you don't provide one, a generic class extending `BaseModel` will be created and used. For any record-level logic, you'll need t create a custom class extending BaseModel. See [Model Classes](./model-classes)
- **`idField {String}`** is the attribute on the record that will serve as the unique identifier or "primary key" in the database. See [Model Classes](./model-classes#compound-keys) for a recipe that might work for **compound keys** (multiple fields).
- **`tempIdField {String}`** is the attribute on the record that will serve as the unique identifier for items that are temporarily created in the store but not send to the server yet
- **`id {String}`** is the identifier of the Pinia store.
- **`clientAlias {String}`** is the name of the FeathersClient instance to use for this service. See [State](#state). It must match a value in the `clients` option. Defaults to `api`
- **`clients {Object}`** is an object whose keys are `clientAlias` strings with their corresponding `FeathersClient` values. The default `api` key must be provided. Additional keys can represent clients to other API servers.
- **`enableEvents {Boolean}`** enables and disables the built-in realtime event handlers. Defaults to `true`.
- **`handleEvents {Object}`** is an object that lets you customize how realtime events are handled. Each key is a name of a realtime event handler function: `created`, `patched`, `updated`, or `removed`. By default, each handler returns the value of `enableEvents`, which is why setting `enableEvents` to false will disable all handlers. You can provide your own handler to customize and override individual events.
- **`debounceEventsTime {Number}`** determines how long to wait until flushing a batch of events. Defaults to `20`. If no events have been received in a 20 millisecond period, all gathered events will be processed.
- **`debounceEventsMaxWait {Number}`** allows forcing events to be flushed after a certain number of milliseconds. Defaults to `1000`.
- **`whitelist`** is an array of keys to allow in the `findInStore` getter's `params.query` object.
- **`paramsForServer`** is an array of keys to allow in the params object for the `find` actions's `params.query` object but to omit on the `findInStore` getter's `params.query` object.
- **`state`** is a function that returns an object of custom state to customize the store.
- **`getters`** is an object of custom getters to customize the store.
- **`actions`** is an object of custom actions to customize the store.

## State

Here's the interface for the Service State

```ts
export interface ServiceState<M extends Model = Model> {
  clientAlias: string
  servicePath: string
  pagination: {
    [k: string]: any
  }
  idField: string
  tempIdField: string
  itemsById: {
    [k: string]: M
    [k: number]: M
  }
  tempsById: {
    [k: string]: M
    [k: number]: M
  }
  clonesById: {
    [k: string]: M
    [k: number]: M
  }
  pendingById: {
    [k: string]: PendingById | ModelPendingState
    [k: number]: PendingById
  }
  eventLocksById: {
    created: { [k: string]: M, [k: number]: M }
    patched: { [k: string]: M, [k: number]: M }
    updated: { [k: string]: M, [k: number]: M }
    removed: { [k: string]: M, [k: number]: M }
  }
  whitelist?: string[]
}
```

Let's go over each part of the state in more detail:

- **`clientAlias`** is the same as the `clientAlias` option that was provided during setup. See the `service` getter.
- **`servicePath`** is the same as the `servicePath` option that was provided during setup. See the `service` getter.
- **`pagination`** keeps track of the latest pagination data for each paginated request to the server. You generally won't manually modify this.
- **`idField`** is the same as the `idField` option that was provided during setup. It specifies which field is the "primary key" identifier in the database.
- **`tempIdField`** is the same as the `tempIdField` option that was provided during setup. It specifies which field is the temporary identifier.
- **`itemsById`** generally contains records retrieved from the API server.
- **`tempsById`** holds records that don't have an `idField` assigned from the API server. They only exist on the client.
- **`clonesById`** all clones, keyed by id. See [Model Instances](./model-instances).
- **`pendingById`** keeps track of individual records that have pending requests. This powers the `isSavePending` and similar getters on each record. See [Model Instances](./model-instances).
- **`eventLocksById`** helps prevent receiving normal, duplicate responses from the API server during CRUD actions. Instead of processing both the CRUD response AND the realtime event data, it only handles one of them.
- **`whitelist`** is an array of key names that are whitelisted in the `findInStore` getter params.

## Getter Attributes

The following getters are available in every service store. Since they're getters, they are all reactive (meaning the template will update automatically as their values change). In the next section you'll find the getters that accepts arguments to query data from the store.

### `service`

Returns the FeathersClient service instance. This value is dynamic based on two values in the [State](#state).

- Change `clientAlias` to have the store use a different configured api server.
- Change `servicePath` to have the store use a different service on the same api server.

### `Model`

Gives access to the `Model` class provided during setup.

### IDs & Lists

These getters return arrays of `ids` or instances currently in state.

- **`itemIds`** all keys from `itemsById`.
- **`items`** all values from `itemsById`.
- **`tempIds`** all keys from `tempsById`.
- **`temps`** all values from `tempsById`.
- **`cloneIds`** all keys from `clonesById`.
- **`clones`** all values from `clonesById`.

### Pending Status

These getters return boolean pending status for this service store.

- **`isCreatePending`** will be truthy when there's a `create` request pending for this service.
- **`isPatchPending`** will be truthy when there's a `patch` request pending for this service.
- **`isUpdatePending`** will be truthy when there's a `update` request pending for this service.
- **`isRemovePending`** will be truthy when there's a `remove` request pending for this service.

## Query Getters

These special getters accept arguments that allow you to query data from the store. Their return values are still reactive.

### `findInStore(params)`

Performs reactive queries against the data in `itemsById`. To also include data from `tempsById`, set `params.temps` to `true`.

> Tip: use `findInStore` and enjoy [Automatic Instance Hydration](#automatic-instance-hydration)

### `countInStore(params)`

returns the `total` returned from `findInStore`, without returning the data.

### `getFromStore(id, params)`

Works similar to `.get` requests in a Feathers service object. It only returns records currently populated in the store.

> Tip: use `getFromStore` and enjoy [Automatic Instance Hydration](#automatic-instance-hydration)

## Actions

### `addToStore(data)`

Adds the data as a Model instance / multiple instances to the store.

### `removeFromStore(data)`

Removes the matching record(s) from the store.

### `find(params)`

Uses the Feathers Client to retrieve records from the API server. On an SSR server, find data will be marked as `ssr: true`, which allows extra queries to be skipped on the client.

```vue
<script setup>
import { useTodos } from '../store/todos'

const todoStore = useTodos()

todoStore.find({ query: {} }).then(/* ... */)
</script>
```

### `count(params)`

Like `find`, but returns the number of records that match the query. It does not return the actual records.

### `get(id, params)`

Uses the Feathers Client to retrieve a single record from the API server.

```vue
<script setup>
import { useTodos } from '../store/todos'

const todoStore = useTodos()

todoStore.get(1).then(/* ... */)
</script>
```

### `update(id, data, params)`

Uses the Feathers Client to send an `update` request to the API server.

### `patch(id, data, params)`

Uses the Feathers Client to send an `patch` request to the API server.

### `remove(id, params)`

Uses the Feathers Client to send a `remove` request to the API server.

## Custom Properties

You can customize a store using the `state`, `getters` and `actions` options. It's possible to overwrite the built-in properties.

## Server Side Rendering (SSR)

### Automatic Instance Hydration

Normally, during SSR, after the rendered page has been delivered to the client, the browser takes any inline JSON payload and pushes it into the store. This is called hydration. A common problem with hydration is that it doesn't know about Feathers-Pinia Model classes, or that records should be instances. You recognize the problem when the browser throws an error stating something like:

```txt
Error: object has no method named `.save()`
```

That's because plain objects don't actually have a `save()` method. Only once a plain object has been turned back into a Model instance does it have a `save()` method. So we need to make sure that data is fully hydrated into an actual instance before using its methods.

Instead of automatically hydrating every instance in the store, Feathers-Pinia uses a more performant rule: Only hydrate the instances actually in use. It achieves this through the Query Getters. Any plain record returned by `store.findInStore` or `store.getFromStore` will automagically be turned into a fully hydrated model instance.
