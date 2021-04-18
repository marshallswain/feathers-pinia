# Sync with Storage

A new `syncWithStorage` utility is now available.  It watches for changes in the store and writes the changes in localStorage.  Other key features include:

- Only specified keys are saved to localStorage.  This makes sure you don't accidentally cache any important loading state, for example.
- All data is stored using LZW compression.  This feature is provided by the `lz-string` package.  This means that you can fit roughly 10MB of data into the 5MB localStorage limit. Since `lz-string` is super fast, this takes only a couple of ms.
- On startup, it will automatically decompress and restore the data.  Decompression is also extremely fast.
- It is enabled on a per-store basis.  This offers much more control, and there's rarely a need to cache the entire store.
- By default, it uses window.localStorage, and it's compatible with any `Storage` interface using the third argument.
- Even with the compression utilities, this feature only adds 1.5k to your final, gzipped production bundle.

Here's an example of what it looks like to use:

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
syncWithStorage(todoStore, ["ids", "itemsById"]);
```

Note in the above example that we didn't have to pass the `pinia` instance to `useTodos()`.  This is because `feathers-pinia` does this under the hood for you.

## API

The `syncWithStorage` function accepts three arguments:

- `store` The initialized pinia `store` **required**
- `keys[]`An array of strings representing the keys whose values should be cached. **required**
- `storage{}` an object conforming to the `Storage` interface (same as `localStorage`, `sessionStorage`, etc.  **optional: defaults to `localStorage`**