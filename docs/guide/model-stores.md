---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Model Stores

[[toc]]

Model Functions come with their own built-in stores. Here's where you can find information about each store.

## BaseModel Stores

BaseModel stores use only a subset of the API returned by [useService](/guide/service-stores). The store doesn't include
any state or methods that are used with Feathers services.  Check out the
[comparison of default Model Function stores](#comparing-stores).

## FeathersModel Stores

FeathersModel stores come with the full [useService](/guide/use-service) store under the hood.

## Comparing Stores

::: code-group

```js [BaseModel store]
// items
itemsById
items
itemIds

// temps
tempsById
temps
tempIds

// clones
clonesById
clones
cloneIds
clone()
commit()
reset()

// storage
findInStore()
countInStore()
getFromStore()
addToStore()
removeFromStore()
clearAll()

// internal state
idField
associations
whitelist
```

```js [FeathersModel store]
// items
itemsById
items
itemIds

// temps
tempsById
temps
tempIds

// clones
clonesById
clones
cloneIds
clone()
commit()
reset()

// storage
findInStore()
countInStore()
getFromStore()
addToStore()
removeFromStore()
clearAll()

// internal state
idField
associations
whitelist

// FeathersModel internal state
service
paramsForServer
skipGetIfExists
isSsr

// pagination
pagination
updatePaginationForQuery()
unflagSsr()

// pending state
isPending
createPendingById
updatePendingById
patchPendingById
removePendingById
isFindPending
isCountPending
isGetPending
isCreatePending
isUpdatePending
isPatchPending
isRemovePending
setPending()
setPendingById()
unsetPendingById()
clearAllPending()

// event locks
eventLocks
toggleEventLock()
clearEventLock()

// service methods
find()
count()
get()
create()
update()
patch()
remove()

// service utils
useFind()
useGet()
useGetOnce()
useFindWatched()
useGetWatched()
```

:::
