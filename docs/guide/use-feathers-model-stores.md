---
outline: deep
---

# FeathersModel Stores

[[toc]]

Model Functions come with their own built-in stores. The BaseModel store API is a subset of the FeathersModel store.

**Related reading:**

- [FeathersModel Static API](/guide/use-feathers-model)
- [FeathersModel Instance API](/guide/use-feathers-model-instances)
- [useService API](/guide/use-service)

## Creating a FeathersModel Store

FeathersModel stores are created only when you create a FeathersModel Function using [useFeathersModel](/guide/use-feathers-model).
The default store is found at `Model.store`:

<!--@include: ./types-notification.md-->

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

console.log(Task.store) // --> See API, below
```

Similar to a Pinia store, the top-level of the store is a `reactive`, which means nested `computed` properties will be
unwrapped, which means you don't have to access their contents using `.value`, like you would with a Vue `ref` or
`computed`, normally.

## API

FeathersModel stores use the [useService](/guide/use-service) utility under the hood. This means that they implement all
of the same APIs as BaseModel and include the full API for communicating with a Feathers service.

For API docs, see [useService](/guide/use-service).
