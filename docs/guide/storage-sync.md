---
outline: deep
---

# Sync with Storage

[[toc]]

A utility for syncing with Storage is included with Feathers-Pinia: `syncWithStorage`. It watches for changes in specified keys in the store and writes the changes to localStorage. Other key features include:

- Enabled on a per-store basis. This offers much more control, and there's rarely a need to cache the entire store.
- Only specified keys are saved to localStorage. This makes sure you don't accidentally cache any important loading state, for example.
- By default, they use `window.localStorage`, while also being compatible with any `Storage` interface. Use the third argument to provide your own storage.

Here's an example of its use while setting up a store:

```ts
import { defineStore, BaseModel } from './store.pinia'
import { apiClient } from '../feathers'
// Bring in the `syncWithStorage` utility.
import { syncWithStorage } from 'feathers-pinia'

export class Todo extends BaseModel {}

const servicePath = 'todos'
export const useTodos = defineStore({
  servicePath,
  Model: Todo,
})

apiClient.service(servicePath).hooks({})

const todoStore = useTodos()

// Pass the "used" store as the first argument to `syncWithStorage`
syncWithStorage(todoStore, ['ids', 'itemsById'])
```

Note in the above example that we didn't have to pass the `pinia` instance to `useTodos()`. This is because `feathers-pinia` does this under the hood for you.

## API

The `syncWithStorage` utility accepts three arguments:

- `store` The initialized pinia `store` **required**
- `keys[]`An array of strings representing the keys whose values should be cached. **required**
- `storage{}` an object conforming to the `Storage` interface (same as `localStorage`, `sessionStorage`, etc. **optional: defaults to `localStorage`**
