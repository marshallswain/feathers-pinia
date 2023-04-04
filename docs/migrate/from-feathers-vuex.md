---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# 🚧 Migrate from Vuex ≤ 4 🚧

## Setup

For a detailed walkthrough refer to the [setup guide](/guide/setup) that most matches your chosen framework.

## Using Stores

The only way to directly reference a Feathers-Pinia store is through the Feathers Client:

```ts
const { api } = useFeathers()

const userStore = api.service('users').store
```

## Steps

**If you haven't completed the initial [setup](./setup), please do so first.**

The following steps outline the specific migration steps to apply to your codebase. The list might not be exhaustive, be sure to apply these concepts to any custom implmentation or variation you might have.

### Convert your Models

See the section on [converting from Model Classes to Implicit Modeling](/guide/migrate-models).

#### Imports

- **npm:** (optionally) uninstall `vuex` and `feathers-vuex` and install `pinia` and `feathers-pinia`
- **imports:**
  - setup your Feathers-Pinia client and the `useFeathers` composable.
  - replace all instances of `from 'feathers-vuex'` with `const { api } = useFeathers`

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

- **`useFind`:** is now `service.useFind`. The API is the same. See [service.useFind](./services#useFind)
- **`useGet`:** is now `service.useGet`. The API is the same. See [service.useGet](/guide/services#useGet)
- **usePagination:** is integrated into `service.useFind`
- **handleClones:** is gone and built into the instance interface. See [Migrate Clone Handling](/guide/migrate-handle-clones)

#### Renderless components

Renderless components have been removed and replaced by the `service.useFind` and `service.useGet` utilities.

## Compared to Feathers-Vuex

Apart from being a LOT faster and having a really clean API (thanks to Pinia), there are a few breaking changes to some
of the familiar processes from Feathers-Vuex.

### New Model Instances Not Added to the store

With Feathers-Vuex, when you called `new Model(data)`, the new instance would automatically get added to the store.

In Feathers-Pinia, you have to call `service.new(data).addToStore()` to manually add the instance to the store.

```ts
const { api } = useFeathers()

const todo = api.service('todos').new({ name: 'do something' })
todo.addToStore()
```

### Calling .clone() on a clone is allowed

In Feathers-Vuex you couldn't call `.clone()` on a clone. Now, calling `.clone()` will do the same as calling
`clone.reset()`.

### Store Structure Changes

Since `state`, `getters`, and `actions` all live inside the same Pinia store object, the getters have been renamed to
avoid colliding with action names.

#### State

- `ids` is no longer in state. It's now a getter named `itemIds`.
- `keyedById` is now called `itemsById`.

#### Getters

- **`service.findInStore`** takes the place of the `find` getter.
- **`service.countInStore`** takes the place of the `count` getter.
- **`service.getFromStore`** takes the place of the `get` getter.
- **`service.patchInStore`** is new
- **`service.removeFromStore`** is new and can remove items with a query.
- **`service.store.itemIds`** takes the place of the `ids` array in data.
- **`service.store.items`** takes the place of the `list` getter.
- **`service.store.tempIds`** is like `itemIds` but for temp records.
- **`service.store.temps`** is a new array of temp records.
- **`service.store.cloneIds`** is like `itemIds` but for clone records.
- **`service.store.clones`** is a new array of clone records.

#### Actions Mostly the Same

- **`service.store.find`**
- **`service.store.findOne`** is new
- **`service.store.count`**
- **`service.store.get`**
- **`service.store.create`**
- **`update`** is removed.
- **`service.store.patch`**
- **`service.store.remove`**
- **`service.store.addOrUpdate`**
- **`service.store.addToStore`** is a new alias to `addOrUpdate`
- **`service.store.clearAll`**
- **`service.store.clone`** is still around, but it's better to use `instance.clone()`.
- **`service.store.commit`** is still around, but it's better to use `clone.commit()`.
- **`service.store.reset`** is still around, but it's better to use `clone.reset()`
- **`hydrateAll`** is removed. Hydration happens automagically as you pull data from the store.

## No `preferUpdate` option

Feathers-Pinia does not have a `preferUpdate` option, nor does it support `update`.  Use `service.store.patch` or
`instance.patch`, instead.

## Migrate `handleClones`

The `handleClones` utility is now `useClones` and has a cleaner API. See the page on [Migrating handleClones](/guide/migrate-handle-clones)
