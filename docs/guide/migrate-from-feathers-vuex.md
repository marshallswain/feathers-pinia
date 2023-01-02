---
outline: deep
---

<script setup>
import V2Block from '../components/V2Block.vue'
</script>

<V2Block />

# 🚧 Migration from Vuex ≤ 4 🚧

> 🚧 This page is a work in progress. If you see something that needs more clarity, please open an issue. 🚧

<script setup>
import BlockQuote from '../components/BlockQuote.vue'
</script>

Despite the structure of Vuex and Pinia stores being different, a lot of the logic can be re-used. This guide serves to outline the basic steps required for migrating a project using Vuex and FeathersVuex to Pinia and FeathersPinia.

<BlockQuote label="TIP ABOUT VUEX VERSIONS">

Vuex 3.x is for Vue 2

Vuex 4.x is for Vue 3

The sooner you migrate away from Vuex, the sooner you'll enjoy massive speed and development improvements, and Feathers-Pinia makes it so much nicer.

</BlockQuote>

## File Structure

The following structure (adapted from the [pinia official documentation](https://pinia.esm.dev/cookbook/migration-vuex.html#restructuring-modules-to-stores)) shows how to migrate from modules, to the more decentralized pinia stores and how to organize them, alongside those augmented with feathers-pinia.

```sh
# Vuex example (assuming namespaced modules)
src
└── store
    ├── index.js           # Initializes Vuex, imports modules
    └── modules
        ├── module1.js     # 'module1' namespace
        └── nested
            ├── index.js   # 'nested' namespace, imports module2 & module3
            ├── module2.js # 'nested/module2' namespace
            └── module3.js # 'nested/module3' namespace
# Pinia equivalent, note ids match previous namespaces
src
└── stores
    ├── index.js          # (Optional) Initializes Pinia, does not import stores
    ├── module1.js        # 'module1' id
    ├── module2.js        # 'module2' id
    ├── store.js          # (Optional) Initializes Pinia, does not import stores
    ├── service1.js       # 'service1' id
    └── service2.js       # 'service2' id
```

### Re-exporting stores from a single file

Pinia is modular and composable by design, however, this makes it cumbersome to import the individual (and independent) stores when needed. The optional `src/stores/index.js` file is for convenience to import stores from a single file:

```javascript
import { useStore1, useStore2, useStore3 } from '@/stores'
```

instead of:

```javascript
import { useStore1 } from '@/stores/store-1'
import { useStore2 } from '@/stores/store-2'
import { useStore3 } from '@/stores/store-3'
```

and could look like this:

```javascript
export * from './store-1'
export * from './store-2'
export * from './store-3'
```

Note also that re-exporting files from a single file like shown above should not break code splitting.

## Setup

For a more detailed walkthrough refer to the [setup guide](/guide/setup).

```javascript
// src/stores/store.js
import { createPinia } from 'pinia'
import { setupFeathersPinia } from 'feathers-pinia'
import { api } from '@/feathers'

export const pinia = createPinia()

export const { defineStore, BaseModel } = setupFeathersPinia({ clients: { api } })
```

## Usage

Stores in pinia should be imported whenever they are to be used. You don't have to worry about performance optimizations, pinia does this under-the-hood for you.

### Usage in Components (.vue)

Within components, you can instantiate stores directly with `const store = useStore()`.

```javascript
// src/stores/todos.js
import { pinia } from 'pinia'
import { defineStore, BaseModel } from './store.js'

// avoid exporting Model to prevent accessing it directly (enforce access via store.Model)
class Todo extends BaseModel {}

const servicePath = 'todos'

const useTodosStore = defineStore('todos', {
  servicePath,
  model: Todo,
  state: () => ({...}),
  getters: {...},
  actions: {...}
})

const todosStore = useTodosStore(pinia)

if (import.meta.env.PROD)
  syncWithStorageCompressed(todosStore, ['itemsById', 'tempsById'])

else
  syncWithStorage(todosStore, ['itemsById', 'tempsById'])

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useTodosStore as any, import.meta.hot))
```

### Usage outside of components (.js or .ts)

Outside of components pinia might not be registered yet, so instantiating stores require binding the pinia instance created above with `const store = useStore(pinia)`. This is especially problematic with Vue 2 which relies on `Vue.use()` and the order of the ES imports/exports.

```javascript
// src/stores/todos.js
import { pinia } from 'pinia'
import { defineStore, BaseModel } from 'feathers-pinia'

// avoid export Model to prevent accessing it directly and enforce access through store.Model
class Todo extends BaseModel {}

const servicePath = 'todos'

// could also directly provide the id within the options
// e.g. defineStore({ id: 'todos', ... }) or skip it and let
// feathers-pinia apply the default `service.${servicePath}`
const useTodosStore = defineStore('todos', {
  servicePath,
  model: Todo,
  state: () => ({}),
  getters: {},
  actions: {}
})
```

**Important:** feathers-pinia will default to an id of `service.${servicePath}` if no id is provided to `defineStore`.
This makes it easy to distinguish regular pinia stores from those created with feathers-pinia.

## Steps

**If you haven't completed the initial [setup](./setup), please do so first.**

The following steps outline the specific migration steps to apply to your codebase. The list might not be exhaustive, be sure to apply these concepts to any custom implmentation or variation you might have.

#### Imports

- **npm:** (optionally) uninstall `vuex` and `feathers-vuex` and install `pinia` and `feathers-pinia`
- **imports:** find and replace all `from 'feathers-vuex'` with `from 'feathers-pinia'`

#### Breaking Changes

- Add model instances to store after intantiation with `instance.addToStore()` (see [here](./index#new-model-instances-not-added-to-the-store))
- **Find and replace state, getters and actions** according to [this](./index#store-structure-changes) list.

#### Stores

Make sure you import and create store beforehand with `const <id>Store = use<id>Store`

- **state:** find and replace all `$store.state.<id>.<stateName>` with `<id>Store.<stateName>`
- **getters:** find and replace all `$store.state.<id>.<getterName>` with `<id>Store.<getterName>`
- **mutations:** find and remove all mutations and invocations via `$store.commit`. Replace with actions if needed.
- **actions:** find and replace all `$store.dispatch('<id>/<actionName>', payload)` with `<id>Store.<actionName>(payload)`
- Now apply the aforementioned steps by replacing `$store` with `store` (without `$`).
- **computed props from state:** find and replace any object computed properties e.g. `const doneTodos = computed({ get: () => $store.state.todos.doneTodos, set: (val) => $store.commit('todos/SET_DONE_TODOS', val) })` simply by accessin the reactive store directly via `todosStore.doneTodos` (and add this property to the state of the store). The same is true for computed props from getters.
- **ModelClass:** find and replace all direct access via `ModelClass` with `store.Model`. Note you could still use e.g. `const ModelClass = models.api[modelName]`, however store must be first initialized. Accessing the Model indirectly through the store ensures the store is previously instantiated.

#### Common Tools

- **`useFind`:** has been renamed to `useFindWatched`. The API is the same. (See [here](./use-find-watched))
- **`useGet`:** has been renamed to `useGetWatched`. The API is the same. (See [here](/guide/use-get-watched))
- **usePagination:** (optional) replace custom implementations of pagination with the `usePagination` utility
- **handleClones:** the new `handleClones` utility removes boilerplate from the clone and commit pattern (see [here](/guide/handle-clones))

#### Renderless components

- If you where using renderless components `<feathers-vuex-form-wrapper>` and/or `<feathers-vuex-form-input>`, you can either create 2 custom components to recreate that functionality or use the recommended `handleClones` utility.

**Tip:** you can use of the find-and-replace functionality in the IDE of your choice to make this easier.

## Compared to Feathers-Vuex

Apart from being a LOT faster and having a really clean API (thanks to Pinia), there are a few breaking changes to some of the familiar processes from Feathers-Vuex.

### New Model Instances Not Added to the store

With Feathers-Vuex, when you called `new Model(data)`, the new instance would automatically get added to the store.

In Feathers-Pinia, you have to call `instance.addToStore()` to manually add the instance to the store.

```ts
import { models } from 'feathers-pinia'

const todo = new models.api.Todo({ name: 'do something' })
todo.addToStore()
```

### Calling .clone() on a clone is allowed

In Feathers-Vuex you couldn't call `.clone()` on a clone. Now, calling `.clone()` will do the same as
calling `.reset()`.

### Store Structure Changes

Since `state`, `getters`, and `actions` all live inside the same Pinia store object, the getters have been renamed to avoid colliding with action names.

#### State

- `ids` is no longer in state. It's now a getter named `itemIds`.
- `keyedById` is now called `itemsById`.

#### Getters

- **`findInStore`** takes the place of the `find` getter.
- **`countInStore`** takes the place of the `count` getter.
- **`getFromStore`** takes the place of the `get` getter.
- **`itemIds`** takes the place of the `ids` array in data.
- **`items`** takes the place of the `list` getter.
- **`tempIds`** is like `itemIds` but for temp records.
- **`temps`** is a new array of temp records.
- **`cloneIds`** is like `itemIds` but for clone records.
- **`clones`** is a new array of clone records.

#### Actions Mostly the Same

- **`find`**
- **`count`**
- **`get`**
- **`create`**
- **`update`**
- **`patch`**
- **`remove`**
- **`removeFromStore`**
- **`addOrUpdate`**
- **`addToStore`** is a new alias to `addOrUpdate`
- **`clearAll`**
- **`clone`**
- **`commit`**
- **`reset`**
- **`hydrateAll`** might be deprecated. Hydration with Pinia is as simple as `Object.assign(store, data)`.
