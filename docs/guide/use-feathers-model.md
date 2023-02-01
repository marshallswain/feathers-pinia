---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import pkg from '../../package.json'
import BlockQuote from '../components/BlockQuote.vue'
</script>

<div style="position: fixed; z-index: 1000; top: 2px; right: 2px;">
  <Badge :label="`v${pkg.version}`" />
</div>

# useFeathersModel

[[toc]]

FeathersModel is the quivalent to the old BaseModel class. It comes with everything needed to manage both data storage
and service communications.

**Related reading:**

- [FeathersModel Instance API](/guide/use-feathers-model-instances)
- [FeathersModel Stores](/guide/use-feathers-model-stores)
- [useService API](/guide/use-service)

## Create FeathersModel Functions

To create a FeathersModel function, you start with a plain function. The function receives an object and returns a
modified form of that same object. You then pass an options object and the function you created as arguments to the
`useFeathersModel` utility. The result is a `FeathersModel` function that gives your data super powers!

If you want TypeScript types to work, you must provide the generics in this order:

- ServiceResult
- ServiceData
- ServiceQuery
- `typeof modelFn`

<!--@include: ./notification-feathers-client.md-->

```ts
import type { Tasks, TasksData, TasksQuery } from 'my-feathers-api'
import { type ModelInstance, useFeathersModel, useInstanceDefaults } from 'feathers-pinia'
import { api } from '../feathers'

const modelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({ description: '', isComplete: false }, data)
  return withDefaults
}
const Task = useFeathersModel<Tasks, TasksData, TasksQuery, typeof modelFn>(
  { name: 'Task', idField: '_id', service },
  modelFn,
)
```

### useFeathersModel(options, modelFn)

- `options {Object}`
  - `name {string}` the name of the Model function. Best to make it unique. **Required**
  - `idField {string}` the name of the field containing each instance's unique identifier. **Required**
  - `service {FeathersClientService}` a Feathers Client service, like `api.service('tasks')`. **Required**
  - `whitelist {string[]}` extra query params to be allowed when querying the local data store.
- `modelFn` a function that receives a `ModelInstance`object and returns a modified version of that object.

## Model Store

The following static attributes exist directly on FeathersModel Functions:

- `store` the internal Model store, which can be replaced by using `setStore`.
- `setStore(store)` allows replacing the internal Model.store. If the store has a `setModel` function, the model will
call it with itself as the argument.

See [Model Stores](/guide/model-stores) for more information.

## Proxy Static Methods

In addition to the [BaseModel Static Methods](/guide/use-base-model#proxy-static-methods) a few store methods are
proxied directly onto FeathersModel's static interface:

### Service Methods

- `find(params)`
- `count(params)`
- `get(id, params)`
- `create(data, params)`
- `update(id, data, params)`
- `patch(id, data, params)`
- `remove(id, params)`

FeathersModel is built on `useService`. Read the [useService API docs](/guide/use-service#service-methods).

View the [Static Interface Comparison](/guide/model-functions#compare-static-properties) of BaseModel and FeathersModel.

### Service Utility methods

- `useFind(params)`
- `useGet(id, params)`
- `useGetOnce(id, params)`
- `useFindWatched(options)`
- `useGetWatched(options)`

FeathersModel is built on `useService`. Read the [useService API docs](/guide/use-service#service-utils).

View the [Static Interface Comparison](/guide/model-functions#compare-static-properties) of BaseModel and FeathersModel.

## Model Events

FeathersModel is built on BaseModel. Refer to the [BaseModel Events API](/guide/use-base-model#model-events)
