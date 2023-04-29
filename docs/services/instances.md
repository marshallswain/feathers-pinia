---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# `ServiceInstance` API

Learn about instance-level properties and methods on service-related data.

[[toc]]

## Instance API Overview

Every record retrieved from the API or service store will be a functional `ServiceInstance` with the following instance API. You can also manually create instances using the `service.new` method.

```ts
api.service('todos').new(data)
```

Every instance contains the properties described below.

## Built on the Data Stores Instance API

All FeathersModel instances also include the properties and methods found in the [StoreInstance API](/data-stores/instances).
This page only covers the methods that are unique to FeathersModel instances.

## Instance Properties

### __isServiceInstance

A boolean that indicates that this is a Feathers instance.

### isPending

Reads store state and evaluates to `true` if any type of request is pending for the instance.

```ts
import { Task } from '../models/task'

const task = Task({ description: 'Do the dishes' })
const request = task.save() // or any Feathers method
console.log(task.isPending) // --> true
```

### isSavePending

Reads store state and evaluates to `true` if there is a pending `create` or `patch` request for the instance.

```ts
task.isSavePending // --> boolean
```

### isCreatePending

Reads store state and evaluates to `true` if there is a pending `create` request for the instance.

```ts
task.isCreatePending // --> boolean
```

### isPatchPending

Reads store state and evaluates to `true` if there is a pending `patch` request for the instance.

```ts
task.isPatchPending // --> boolean
```

### isRemovePending

Reads store state and evaluates to `true` if there is a pending `remove`request for the instance.

```ts
task.isRemovePending // --> boolean
```

## API Methods

The following methods are available on FeathersModel instances:

### `instance.save(params)`

The `save` method is a convenience wrapper for the `create/patch` methods. If the record has no idField, the
`instance.create()`method will be used. The`params` argument will be used in the Feathers client request. See the
[Feathers Service](https://docs.feathersjs.com/guides/basics/services.html#service-methods) docs, for reference on where
params are used in each method.

```ts
import { Task } from '../models/task'

// Call createInStore to get a reactive Vue object
const task = Task({ description: 'Do something!' }).createInStore()

await task.save() // --> Creates the task on the server.
```

Once the `create` response returns, the record will have an idField assigned by the server. Most databases give each
record an `id`. Others use a different field. For example, MongoDB uses `_id`. If you call `instance.save()` again, the method will call `instance.patch()`. Which method is used depends solely on whether the data has a proeprty matchin ghte `idField` in the service store.

When calling `save()` on a clone, you can [use special params to handle patch diffing](#patch-diffing).

### `instance.create(params)`

The `create` method calls the `create` action (service method) using the instance data. The `params` argument will be used in the Feathers client request. See the [Feathers Service](https://docs.feathersjs.com/guides/basics/services.html#service-methods) docs, for reference.

You might not ever need to use `.create()`, but can instead use the `.save()` method. Let Feathers-Pinia call `create` or `patch`.

```js
const task = Task({ description: 'Do something!' })

await task.create() // --> Creates the task on the server using the instance data
```

### `instance.patch(data, params)`

The `patch` method calls the `patch` action (service method) using the instance data. The instance's id field is used for the `patch` id. The `params` argument will be used in the Feathers client request. See the [Feathers Service](https://docs.feathersjs.com/guides/basics/services.html#service-methods) docs, for reference.

Similar to the `.create()` method, you might not ever need to use `.patch()` if you just use `.save()` and let Feathers-Pinia figure out how to handle it.

```js
const task = Task({ id: 1, description: 'Do something!' })
task.description = 'Do something else'
await task.patch() // --> Sends a `patch` request the with the id and description.
```

When calling `save()` on a clone, you can [use special params to handle patch diffing](#patch-diffing).

### `instance.remove(params)`

## Patch Diffing

<!--@include: ../partials/patch-diffing.md-->
