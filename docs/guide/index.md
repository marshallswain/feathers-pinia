# Introduction

Feathers-Pinia is the next generation of [Feathers-Vuex](https://vuex.feathersjs.com). The difference is that it's built on [Pinia](https://pinia.esm.dev/): a Vue store with an intuitive API.

::: tip Introducing Pinia
PERSONAL OPINION ALERT: [Pinia](https://pinia.esm.dev/) is so simple and elegant. It matches Vue better than Vuex does. The research for Pinia is fueling inspiration for Vuex 5, which means the API is similar to the proposed [Vuex 5 API](https://github.com/kiaking/rfcs/blob/vuex-5/active-rfcs/0000-vuex-5.md).

Using Pinia in your apps will have a few positive effects:

- The clean API requires lower mental overhead to use.
  - No more weird Vuex syntax.
  - No more mutations; just actions.
  - Use Composable Stores instead of injected rootState, rootGetters, etc.
- Lower mental overhead means developers spend more time in a creative space. This usually results in an increase of productivity.
- You'll have smaller bundle sizes. Not only is Pinia tiny, it's also modular. You don't have to register all of the plugins in a central store. Pinia's architecture enables tree shaking, so only the services needed for the current view need to load.
- You'll be more ready for the major breaking changes coming in Vuex 5. Vuex was originally written as a Flux/Redux implementation for Vue. It has served its purpose well. With Vuex 5, the team is focusing on making a Vue store.
  :::

## What's Different from Feathers-Vuex

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
- **`resetCopy`**
- **`hydrateAll`** might be deprecated. Hydration with Pinia is as simple as `Object.assign(store, data)`.
