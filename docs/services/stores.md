---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Service Stores

Learn about the state, getters, and actions in service stores.

[[toc]]

Every service has a `store` property, which includes the following API.

## Returned API

The object returned from `useDataStore` is built on top of the BaseModel store. Refer to the
[Standalone data store documentation](/data-stores/) for API details. The following sections will cover store
APIs not in the BaseModel store.

The following sections cover additional APIs returned when calling `useDataStore`. APIs are grouped by functionality.

### Additional State

- **`service`**
- **`paramsForServer`**
- **`skipGetIfExists`**
- **`isSsr`**

### Model Config

- **`Model`** gives access to the Model Function provided in the options.
- **`setModel(Model)`** Allows setting/replacing the Model. This means you can call `useFind` without a Model and set
the model afterwards.

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
