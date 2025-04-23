---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Hooks

[[toc]]

Feathers-Pinia 2.0 achieves cleaner decoupling between the Models and stores by utilizing Feathers Client hooks. The
hooks are only required when using Feathers service connectivity.

## Registering Hooks

Since all hooks are required, a utility named `feathersPiniaHooks` is provided for registering the hooks in the correct
order.

```ts
import { feathersPiniaHooks } from 'feathers-pinia'

service.hooks({ around: { all: [...feathersPiniaHooks(Model)] } })
```

The utility requires that you pass a Model function then spread the returned array into the `around all` hooks, as
demonstrated in more detail, below. Because they are Model-specific, **hooks must be registered as service-level
hooks**, not app-level hooks.

<!--@include: ./notification-feathers-client.md-->

```ts
import type { ModelInstance } from 'feathers-pinia'
import type { Tasks, TasksData, TasksQuery } from 'my-feathers-api'
import { feathersPiniaHooks, useFeathersModel, useInstanceDefaults } from 'feathers-pinia'
import { api } from '../feathers'

const service = api.service('tasks')

function modelFn(data: ModelInstance<Tasks>) {
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

- `setPending(store)` controls pending state for all request methods.
- `eventLocks(store)` controls event locks to prevent potential duplicate response/events with `patch` and `remove`.
- `syncStore(store)` keeps the store in sync with requested data. Allows skipping the store sync with the `skipStore`
  param.
- `makeModelInstances(Model)` turns data from API responses into modeled data.
- `handleFindSsr(store)` handles data for request state transferred from an SSR server, if enabled.
- `normalizeFind()` takes care of normalizing pagination params for some feathers adapters.
- `skipGetIfExists(store)` prevents get requests when the `skipGetIfExists` option is enabled.
- `patchDiffing(store)` saves bandwidth by diffing clones with original records and only sends the top-level keys that
  have changed.
