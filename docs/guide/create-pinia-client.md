---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# The Feathers-Pinia Client

Wrap your Feathers Client in pure productivity.

[[toc]]

## createPiniaClient

The `createPiniaClient` utility is the primary utility in Feathers-Pinia. It wraps the Feathers Client and enhances it
with additional service methods.

```ts
createPiniaClient(feathersClient, {
  pinia: nuxt.$pinia,
  ssr: !!process.server,
  storage: window.localStorage,
  // below are configurable per service in the `services` object.
  idField: '_id',
  syncWithStorage: true || ['itemsById', 'pagination', 'etc'],
  whitelist: ['$customLocalParam'],
  paramsForServer: ['$customServerParam'],
  skipGetIfExists: true,
  handleEvents: {}, // HandleEvents<AnyData>
  debounceEventsTime: 20,
  debounceEventsGuarantee: false,
  customSiftOperators: {}, // see sift docs
  // runs for every service
  setupInstance: (data = {}, { api, service, servicePath }) => {
    if (servicePath.startsWith('my-')) {
      Object.defineProperty(data, 'belongsToMe', {
        get() {
          return true
        }
      })
    }
    return data
  },
  customizeStore(defaultStore) {
    // You can directly modify the defaultStore object
    defaultStore.globalValue = ref(true)
  },
  // Service config, keyed by path, See service configuration to
  // learn how options are merged with the global config.
  services: {
    users: {
      idField: 'id',
    },
    contacts: {
      whitelist: ['$test'],
      // runs after the global setupInstance
      setupInstance(data: any, { api, service, servicePath }) {
        const withDefaults = useInstanceDefaults({ name: '', age: 0 }, data)
        return withDefaults
      },
      // customize the store for a single service
      customizeStore(defaultStore) {
        defaultStore.contactsValue = ref(true)
        return { otherValue: true } // returned values will be merged, as well
      }
    },
    tasks: {
      skipGetIfExists: true,
    },
  },
})
```

See the configuration sections, below, for the possible configuration values.

## Client Properties

The `createPiniaClient` utility returns a wrapped FeathersPinia Client with the following added properties:

- `pushToStore(data: any, servicePath: string)` pushes data into another service store.
- `defineVirtualProperty(data: any, key: string, getter: Function)` sets up a virtual property on an object.
- `defineVirtualProperties(data: any, virtuals: Record<string, Function>)` sets up many virtual properties on an object.

Learn more about these properties in the [Data Modeling](/guide/data-modeling) guide.

## Global Configuration

The pseudo-interface, below, shows possible configuration values with their default values. Values not followed by `?`
are required and have no default value.

```ts
interface CreatePiniaClientConfig {
  idField: string
  pinia: Pinia
  ssr?: false
  storage?: undefined
  services?: Record<string, PiniaServiceConfig>
  // global and per-service options
  syncWithStorage?: undefined
  whitelist?: string[]
  paramsForServer?: string[]
  skipGetIfExists?: true
  handleEvents?: HandleEvents<AnyData>
  debounceEventsTime?: 20
  debounceEventsGuarantee?: false
  customSiftOperators?: Record<string, SiftOperator>
  setupInstance?: (data = {}, { api, service, servicePath }) => (modifiedData)
  customizeStore?: (defaultStore) => modifiedStore
}
```

Let's take a closer look at each one:

- **`idField {String}`** is the attribute on the record that will serve as the unique identifier or "primary key" in the
database.
- **`pinia {Pinia}`** your app's primary Pinia instance. Allows dynamic creation of stores.
- **`ssr {Boolean}`** indicates if Feathers-Pinia is loading in an SSR environment. Paginated queries made during SSR
will be marked with `ssr: true`. When a matching request is made on the client (when `ssr` is false) the store data will
clear the `ssr` flag for that request.
- **`storage {Storage}`** a `Storage` interface. Must be provided to enable storage sync. The most typical option is
`window.localStorage`.
- **`services {Record<string, PiniaServiceConfig>}`** an object, keyed by service path, which allows passing specific
configuration to individual services. See [Service Configuration](#service-configuration).
- **`syncWithStorage`** can be set to `true` or to an array of store keys to sync to the `storage` adapter. If set to
`true`, the default keys will be used, which are `['itemsById', 'pagination']`.  See [Storage Sync](/guide/storage-sync)
- **`whitelist`** is an array of keys to allow in the `findInStore` queries.
- **`paramsForServer`** is an array of query keys for `findInStore` to ignore and pass to the `find` action's query.
- **`skipGetIfExists {Boolean}`** when enabled will cause a `.get` request to automatically resolve with the stored
record, if one exists. If not, the request will be made as normal.
- **`handleEvents {Object}`** is an object that lets you customize how realtime events are handled. Each key is a name
- of a realtime event handler function: `created`, `patched`, `updated`, or `removed`. You can provide your own handler
- to customize and override individual events. The handler's function signature is

  ```ts
  function eventHandler(data, { service }) {
    // handle event
  }
  const handleEvents = {
    created: eventHandler,
    patched: eventHandler,
    updated: eventHandler,
    removed: eventHandler,
  }
  ```

- **`debounceEventsTime {Number}`** determines how long to wait until flushing a batch of events. Defaults to `20`. If
no events have been received in a 20 millisecond period, all gathered events will be processed.
- **`debounceEventsGuarantee {Boolean}`** forces accumulated events to flush every `debounceEventsTime` interval. Off by
default.
- **`customSiftOperators {Object}`** allows passing an object of custom [sift operators](https://github.com/crcn/sift.js/)
which are used to query data from the store with `findInStore` and `useFind`. All sift operators are enabled for store
queries.
- **`setupInstance {Function}`** a global model function that allows modifying instances from all services. It has the
following shape:

  ```ts
  // modify data and return the modified object
  function setupInstance(data, { app, service, servicePath }) {
    return data
  }
  ```

- **`customizeStore {Function}`** a function that allows modifying the store for all services. Return the modified store
or an object to merge into the store.

## Service Configuration

```ts
interface PiniaServiceConfig {
  /**
   * The name of the store to use for this service. Defaults to `service:${servicePath}`.
   * You can also use storeName to make two services share the same store.
   */
  storeName?: string
  /**
   * Overrides the service used for instance-level service methods, like patch, and remove.
   * Useful for "proxy" services. For example: `pages/full` loads the page record with populated
   * data, but you want to patch/remove the record through the `pages` service.
   */
  instanceServicePath?: string
  /**
   * The name of the id field for this service. Overrides the global idField.
   */
  idField?: string
  whitelist?: string[]
  paramsForServer?: string[]
  skipGetIfExists?: boolean
  handleEvents?: HandleEvents<AnyData>
  debounceEventsTime?: number
  debounceEventsGuarantee?: boolean
  setupInstance?: (data: any, utils: SetupInstanceUtils) => any
  customizeStore?: (data: ReturnType<typeof useServiceStore>) => Record<string, any>
  customSiftOperators?: Record<string, any>
}

interface SetupInstanceUtils {
  app?: any
  service?: any
  servicePath?: string
}
```

The `storeName` and `instanceServicePath` options were introduced in Feathers-Pinia 4.2. They are not configurable at 
the global level.

- **`storeName {String}`** is the name of the store to use for this service. Defaults to `service:${servicePath}`. You can
also use `storeName` to make two services share the same store.
- **`instanceServicePath {String}`** overrides the service used for instance-level service methods, like `patch`, and
`remove`. Useful for "proxy" services. For example: `pages/full` loads the page record with populated data, but you
want to patch/remove the record through the `pages` service.

These options are all configurable at the global and service levels. See descriptions in the global configuration
section. Here is a description of how each option is handled when it's also configured globally:

- **`idField`** overrides the global value
- **`whitelist`** concatenated with the global value
- **`paramsForServer`** concatenated with the global value
- **`skipGetIfExists {Boolean}`** overrides the global value
- **`handleEvents {Object}`** overrides the global value
- **`debounceEventsTime {Number}`** overrides the global value
- **`debounceEventsGuarantee {Boolean}`** overrides the global value
- **`customSiftOperators {Object}`** merged over the global value
- **`setupInstance {Function}`** runs after the global value. The global `setupInstance` will already have been applied
by the time the service-level `setupInstance` runs.
- **`customizeStore {Function}`** runs after the global `customizeStore` and receives the store data with globally-
customized values.
