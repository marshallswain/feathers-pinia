# Service Stores

## Setup

We learned the basics of [how to create service stores](./setup#service-stores) on the setup page.  Let's cover the topic in more detail.

## Using `defineStore`

Here's a look at the `DefineStoreOptions` interface. By the way, there's lots of room for TypeScript improvements in the codebase.  Pull Requests are very much encouraged!

```ts
import { Application as FeathersClient } from '@feathersjs/feathers'

interface DefineStoreOptions {
  servicePath: string
  Model?: any
  idField?: '_id' | string
  id?: string
  clientAlias?: 'api' | string
  clients?: { [alias: string]: FeathersClient }
  handleEvents?: HandleEvents
  enableEvents?: boolean
  debounceEventsTime?: number
  debounceEventsMaxWait?: number
  whitelist?: string[]
  state?: { [k: string]: any }
  getters?: { [k: string]: Function }
  actions?: { [k: string]: Function }
}
interface HandleEvents {
  created?: Function
  patched?: Function
  updated?: Function
  removed?: Function
}
```

Here are a few more details about each option:

- **`servicePath {String}`** is the same as the Feathers service path. ***required***
- **`Model {ModelClass}`** is the class to use for each instance. If you don't provide one, a generic class extending `BaseModel` will be created and used.  For any record-level logic, you'll need t create a custom class extending BaseModel. See [Model Classes](./model-classes)
- **`idField {String}`** is the attribute on the record that will serve as the unique identifier or "primary key" in the database. See [Model Classes](./model-classes#compound-keys) for a recipe that might work for **compound keys** (multiple fields).
- **`id {String}`** is the identifier of the Pinia store.
- **`clientAlias {String}`** is the name of the FeathersClient instance to use for this service. See [State](#state). It must match a value in the `clients` option. Defaults to `api`
- **`clients {Object}`** is an object whose keys are `clientAlias` strings with their corresponding `FeathersClient` values. The default `api` key must be provided. Additional keys can represent clients to other API servers.
- **`enableEvents {Boolean}`** enables and disables the built-in realtime event handlers. Defaults to `true`.
- **`handleEvents {Object}`** is an object that lets you customize how realtime events are handled. Each key is a name of a realtime event handler function: `created`, `patched`, `updated`, or `removed`.  By default, each handler returns the value of `enableEvents`, which is why setting `enableEvents` to false will disable all handlers. You can provide your own handler to customize and override individual events.
- **`debounceEventsTime {Number}`** determines how long to wait until flushing a batch of events. Defaults to `20`. If no events have been received in a 20 millisecond period, all gathered events will be processed.
- **`debounceEventsMaxWait {Number}`** allows forcing events to be flushed after a certain number of milliseconds. Defaults to `1000`.
- **`whitelist`** is an array of keys to allow in the params object for the `findInStore` getter's `params.query` object.
- **`state`** is an object of custom state to customize the store.
- **`getters`** is an object of custom getters to customize the store.
- **`actions`** is an object of custom actions to customize the store.

## Store API

### State

Here's the interface for the Service State

```ts
export interface ServiceState<M extends Model = Model> {
  clientAlias: string
  servicePath: string
  pagination: {
    [k: string]: any
  }
  idField: string
  ids: string[]
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
    created: { [k: string]: M; [k: number]: M }
    patched: { [k: string]: M; [k: number]: M }
    updated: { [k: string]: M; [k: number]: M }
    removed: { [k: string]: M; [k: number]: M }
  }
  whitelist?: string[]
}
```

Let's go over each part of the state in more detail:

- **`clientAlias`** is the same as the `clientAlias` option that was provided during setup. See the `service` getter.
- **`servicePath`** is the same as the `servicePath` option that was provided during setup. See the `service` getter.
- **`pagination`** keeps track of the latest pagination data for each paginated request to the server. You generally won't manually modify this.
- **`idField`** is the same as the `idField` option that was provided during setup.  It specifies which field is the "primary key" identifier in the database.
- **`itemsById`** generally contains records retrieved from the API server.
- **`tempsById`** holds records that don't have an `idField` assigned from the API server.  They only exist on the client.
- **`clonesById`** all clones, keyed by id. See [Model Instances](./model-instances).
- **`pendingById`** keeps track of individual records that have pending requests. This powers the `isSavePending` and similar getters on each record. See [Model Instances](./model-instances).
- **`eventLocksById`** helps prevent receiving normal, duplicate responses from the API server during CRUD actions. Instead of processing both the CRUD response AND the realtime event data, it only handles one of them.
- **`whitelist`** is an array of key names that are whitelisted in the `findInStore` getter params.

### Getters

The following getters are available in every service store.  Since they're getters, they are all reactive (meaning the template will update automatically as their values change):

- **`service`** is the FeathersClient service instance. This value is dynamic based on two values in the [State](#state).
  - Change `clientAlias` to have the store use a different configured api server.
  - Change `servicePath` to have the store use a different service on the same api server.
- **`Model`** gives access to the `Model` class provided during setup.
- **`itemIds`** is an array of the keys in `itemsById`.
- **`items`** is an array of the values in `itemsById`.
- **`tempIds`** is an array of all keys in `tempsById`.
- **`temps`** is an array of all values in `tempsById`.
- **`cloneIds`** is an array of all keys in `clonesById`.
- **`clones`** is an array of all values in `clonesById`.
- **`findInStore(params)`** allows performing reactive queries against the data in `itemsById`. To also include data from `tempsById`, set `params.temps` to `true`.
- **`countInStore(params)`** returns the `total` returned from `findInStore`, without returning the data.
- **`getFromStore(id, params)`** works similar to `.get` requests in a Feathers service object.  It only returns records currently populated in the store.
- **`isCreatePending`** will be truthy when there's a `create` request pending for this service.
- **`isPatchPending`** will be truthy when there's a `patch` request pending for this service.
- **`isUpdatePending`** will be truthy when there's a `update` request pending for this service.
- **`isRemovePending`** will be truthy when there's a `remove` request pending for this service.

### Actions

### Custom Properties

You can customize a store using the `state`, `getters` and `actions` options.

## Server Side Rendering (SSR)