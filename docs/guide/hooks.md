---
outline: deep
---

<script setup>
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Hooks

[[toc]]

Feathers-Pinia 2.0 achieves cleaner decoupling between the Models and stores by utilizing Feathers Client hooks. The
hooks are only required when using Feathers service connectivity.

## Registering Hooks

Since all hooks are required, a utility named `feathersPiniaHooks` is provided for registering the hooks in the correct
order. The utility requires that you pass a Model function then spread the returned array into the `around all` hooks, as
demonstrated here.

<!--@include: ./types-notification.md-->

```ts
import type { Tasks, TasksData, TasksQuery } from 'my-feathers-api'
import { type ModelInstance, useFeathersModel, useInstanceDefaults, feathersPiniaHooks } from 'feathers-pinia'
import { api } from '../feathers'

const service = api.service('tasks')

const ModelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({ description: 'default', isComplete: false }, data)
  return withDefaults
}
const Task = useFeathersModel<Tasks, TasksData, TasksQuery, typeof ModelFn>(
  { name: 'Task', idField: '_id', service },
  ModelFn,
)

// register hooks in the `around all` array
service.hooks({ around: { all: [...feathersPiniaHooks(Task)] } })
```

## Overview of Hooks

These are the hooks that come with Feathers Pinia, in order of registration. These are `around` hooks, so they execute
in reverse order during responses.

- `setPending(ModelFn)` controls pending state for all request methods.
- `eventLocks(ModelFn)` controls event locks to prevent potential duplicate response/events with `patch` and `remove`.
- `syncStore(ModelFn)` keeps the store in sync with requested data. Allows skipping the store sync with the `skipStore`
  param.
- `makeModelInstances(ModelFn)` turns data from API responses into modeled data.
- `normalizeFind()` takes care of normalizing pagination params for some feathers adapters.
- `skipGetIfExists(ModelFn)` prevents get requests when the `skipRequestIfExists` option is enabled.
- `patchDiffing(ModelFn)` saves bandwidth by diffing clones with original records and only sends the top-level keys that
  have changed.
