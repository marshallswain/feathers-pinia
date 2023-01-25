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

# Sync with Storage

[[toc]]

A utility for syncing with Storage is included with Feathers-Pinia: `syncWithStorage`. It watches for changes in specified keys in the store and writes the changes to localStorage. Other key features include:

- Enabled on a per-store basis. This offers much more control, and there's rarely a need to cache the entire store.
- Only specified keys are saved to localStorage. This makes sure you don't accidentally cache any important loading state, for example.
- By default, they use `window.localStorage`, while also being compatible with any `Storage` interface. Use the third argument to provide your own storage.

Here's an example of its use while setting up the model.

```ts
import { type ModelInstance } from 'feathers-pinia'
import type { Tasks, TasksData, TasksQuery } from 'feathers-pinia-api'

export const useTasksConfig = () => {...}

export const useTaskModel = () => {
  const { name, idField, service } = useTasksConfig()

  const Model = useModel(name, () => { ... })

  onModelReady(name, () => {
    service.hooks({ around: { all: [...feathersPiniaHooks(Model)] } })
    syncWithStorage(useTaskStore(), ['ids', 'itemsById'])
  })
  connectModel(name, () => Model, useTaskStore)
  return Model
}
```

## API

The `syncWithStorage` utility accepts three arguments:

- `store` The initialized pinia `store` **required**
- `keys[]`An array of strings representing the keys whose values should be cached. **required**
- `storage{}` an object conforming to the `Storage` interface (same as `localStorage`, `sessionStorage`, etc. **optional: defaults to `localStorage`**
