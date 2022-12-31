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
order. The utility requires that you pass a Model function then spread the returned array into the `around all` hooks,
as demonstrated here. Hooks must be registered as service-level hooks and not app-level hooks.

<!--@include: ./types-notification.md-->

```ts
import type { Tasks, TasksData, TasksQuery } from 'my-feathers-api'
import { type ModelInstance, useFeathersModel, useInstanceDefaults, feathersPiniaHooks } from 'feathers-pinia'
import { api } from '../feathers'

const service = api.service('tasks')

const modelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({ description: 'default', isComplete: false }, data)
  return withDefaults
}
const Task = useFeathersModel<Tasks, TasksData, TasksQuery, typeof modelFn>(
  { name: 'Task', idField: '_id', service },
  modelFn,
)

// register hooks in the `around all` array
service.hooks({ around: { all: [...feathersPiniaHooks(Task)] } })
```

## Overview of Hooks

These are the hooks that come with Feathers Pinia, in order of registration. These are `around` hooks, so they execute
in reverse order during responses.

- `setPending(Model)` controls pending state for all request methods.
- `eventLocks(Model)` controls event locks to prevent potential duplicate response/events with `patch` and `remove`.
- `syncStore(Model)` keeps the store in sync with requested data. Allows skipping the store sync with the `skipStore`
  param.
- `makeModelInstances(Model)` turns data from API responses into modeled data.
- `normalizeFind()` takes care of normalizing pagination params for some feathers adapters.
- `skipGetIfExists(Model)` prevents get requests when the `skipRequestIfExists` option is enabled.
- `patchDiffing(Model)` saves bandwidth by diffing clones with original records and only sends the top-level keys that
  have changed.
