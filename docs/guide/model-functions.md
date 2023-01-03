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

# Model Functions

[[toc]]

Data Modeling is the [most important feature of Feathers-Pinia](/guide/modeling-overview). There are two Model Function
types we can use to model our data:

- [BaseModel](/guide/base-model) provides data storage, retrieval, temp records, and clone/commit methods.
- [FeathersModel](/guide/use-feathers-model) builds on top of BaseModel and adds Feathers service connectivity. It includes
all functionality formerly included in the `BaseModel` class (from previous releases).

The new `BaseModel` allows using the same API for all types of data, not just the data connected to a Feathers API
service. It even includes the `findInStore` API for filtering local data with the Feathers Query Syntax as well as
custom operators like `$iLike` from SQL databases or `$regex` from MongoDB.
[Compare the static store interfaces](#compare-static-properties).

Both Model Functions come with their own stores which do not require Feathers-Pinia. You can overwrite the internal
store by calling `Model.setStore(myPiniaStore)`. Find a [comparison of store properties](#compare-default-stores)
further down this page.

## Which Model Should I Use?

- For basic data modeling not connected to a store: use [BaseModel](/guide/use-base-model).

- For a store-centric workflow with Feathers-connected instances: use
[BaseModel](/guide/use-base-model) with [useFeathersInstance](/guide/model-instances#use-feathers-instance)

- For experience closest to Feathers-Pinia 0.x (or Feathers-Vuex): use [FeathersModel](/guide/use-feathers-model)

### Compare Static Properties

Use the following tabs to compare the properties found directly on BaseModels vs on FeathersModels.

::: code-group

```js [BaseModel]
store
setStore()
findInStore()
countInStore()
getFromStore()
addToStore()
removeFromStore()
associations
```

```js [FeathersModel]
store
setStore()
findInStore()
countInStore()
getFromStore()
addToStore()
removeFromStore()
associations

// FeathersModel adds
find()
count()
get()
create()
update()
patch()
remove()
useFind()
useGet()
useGetOnce()
useFindWatched()
useGetWatched()
```

:::

### Compare Default Stores

View the [comparison of BaseModel stores to FeathersModel stores](/guide/model-stores#comparing-stores).
