---
outline: deep
---

<script setup>
import V2Block from '../components/V2Block.vue'
</script>

<V2Block />

# Sync with Storage

[[toc]]

Two utilities for syncing with Storage are included with Feathers-Pinia: `syncWithStorage` and `syncWithStorageCompressed`. Both watch for changes in the store and write the changes to localStorage. Other key features include:

- It is enabled on a per-store basis. This offers much more control, and there's rarely a need to cache the entire store.
- Only specified keys are saved to localStorage. This makes sure you don't accidentally cache any important loading state, for example.
- By default, they use window.localStorage, while also being compatible with any `Storage` interface. Use the third argument to provide your own storage.

- For `syncWithStorageCompressed`, all data is stored using LZW compression. This feature is provided by the `lz-string` package. This means that you can fit roughly 10MB of data into the 5MB localStorage limit. Since `lz-string` is super fast, this takes only a couple of ms.
- On startup, it will automatically decompress and restore the data. Decompression is also extremely fast.
- Even with the compression utilities, this feature only adds 1.5k to your final, gzipped production bundle.

Here's an example of what it looks like to use:

```ts
import { defineStore, BaseModel } from './store.pinia'
import { apiClient } from '../feathers'
// Bring in the `syncWithStorage` utility.
import { syncWithStorage, syncWithStorageCompressed } from 'feathers-pinia'

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
// Or use the version with LZW compression
syncWithStorageCompressed(todoStore, ['ids', 'itemsById'])
```

Note in the above example that we didn't have to pass the `pinia` instance to `useTodos()`. This is because `feathers-pinia` does this under the hood for you.

## API

The `syncWithStorage` and `syncWithStorageCompressed` utilities both accept three arguments:

- `store` The initialized pinia `store` **required**
- `keys[]`An array of strings representing the keys whose values should be cached. **required**
- `storage{}` an object conforming to the `Storage` interface (same as `localStorage`, `sessionStorage`, etc. **optional: defaults to `localStorage`**
