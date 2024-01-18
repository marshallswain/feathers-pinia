---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# `StoreInstance` API

Learn about storage-related properties and methods on stored data.

[[toc]]

Every record retrieved from the API or service store will be a `ServiceInstance` with the following instance API.

## Instance Properties

`StoreInstance` items have a few non-enumerable properties added to them for convenience. Because they are non-enumerable,
they will never be accidentally serialized into an API request. This prevents validation errors from happening due to
extra, not-allowed attributes showing up in the request.

<BlockQuote label="Define your own properties" type="details">

You can use JavaScript's [Object.defineProperty](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)
or [Object.defineProperties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperties)
methods to create your own non-enumerable properties. With Feathers-Pinia Model instances, you also want to make them
`configurable` to work with the `.clone()` and `.commit()` methods, as shown here:

```ts
Object.defineProperty(data, 'myProp', {
  enumerable: false,
  configurable: true,
  value: 5
})
```

TypeScript cannot currently infer the type, so you have to do it manually. There might be a better way to do it, but my
current method is to cast the type:

```ts
return data as typeof data & { myProp: number }
```

If you know of a better way, please open an issue with an example. Or a pull request. ;)

</BlockQuote>

Here's an overview of the properties on each BaseModel instance

### __isStoreInstance

A boolean indicating that this is a model instance.

```ts
const task = api.service('tasks').new({ description: 'Do the dishes' })

console.log(task.__isStoreInstance) // --> true
```

### __idField

`__idField` is the name of the idField that's configured on the Model Function.

```ts
const task = api.service('tasks').new({ description: 'Do the dishes' })

console.log(task.__idField) // --> `id`
```

### __isTemp

`__isTemp` is a boolean that indicates whether or not this instance is a temp record.

```ts
const task = api.service('tasks').new({ description: 'Do the dishes' })

console.log(task.__isTemp) // --> `id`
```

### __tempId

`__tempId` is a temporary id string that will be automatically added for any instances created without an `idField`.

```ts
// without an id
const task = api.service('tasks').new({ description: 'Do the dishes' })

console.log(task.__tempId) // --> `5e63c3a5e4232e4cd0274ac2`
```

```ts
// with an id
const task = api.service('tasks').new({ id: 1, description: 'Do the dishes' })

console.log(task.__tempId) // --> undefined
```

### __isClone

`__isClone` will be `true` if the instance was created by calling `.clone()` on another instance.

```ts
// regular instances
const task = api.service('tasks').new({ description: 'Do the dishes' })
console.log(task.__isClone) // --> false

const clone = task.clone()
console.log(clone.__isClone) // --> true

const committed = task.commit()
console.log(committed.__isClone) // --> false
```

## Storage Methods

Each instance comes with two methods for adding and removing the instance from the store.

### `instance.createInStore()`

The `createInStore` method adds the instance to the appropriate storage interface inside of the `Model.store`. If the
instance has an `idField`, it will be added to the `items` storage, otherwise it will be added to the `temps` storage.

```ts
// Added to `items` since it has an idField
const task = api.service('tasks').new({ id: 5, description: 'Do the Dishes' })

// Added to `temps` since it has no idField
const task = api.service('tasks').new({ description: 'Do the Dishes' })
```

Thanks to Model Functions, we no longer have to call `.createInStore()` to make an instance reactive. Create an instance
and it is automatically ready to bind to a template. Let there be much rejoicing!

```ts
// Reactive Vue Object
const task = api.service('tasks').new({ description: 'Do the Dishes' })
```

### `instance.removeFromStore()`

You can manually remove an instance from the store by calling `.removeFromStore()`. This will remove the instance from
either the item storage or the temp storage. It does not remove the data from the server. (BaseModel instances are not
connected to the server.)

```ts
// Instance is not yet in the store
const task = api.service('tasks').new({ description: 'Do the Dishes' })

// Instance is added to the store store
task.createInStore()

// Instance is no longer in the store.
task.removeFromStore()
```

## Clone & Commit Methods

Model instance "clone and commit" is [one of the best patterns](/guide/common-patterns.html#clone-and-commit-pattern) in
Feathers-Pinia for keeping store code lean and clean.

### `instance.hasClone()`

Returns the clone, if the instance has one, otherwise returns `false`.

### `instance.clone(params)`

The `.clone()` method creates a deep copy of the record and stores it on `store.copiesById`. This allows you to make
changes to the clone and not update the original until you commit or save the data.

```ts
const task = api.service('tasks').new({ id: 1, description: 'Do something!' })
const clone = task.clone()
clone.description = 'Do something else!'
clone.commit() // --> Update the original item in the store.
console.log(task.description) // --> 'Do something else!'
console.log(clone.description) // --> 'Do something else!'
```

Calling `clone()` at any time will copy the data from the original to the clone, essentially performing a reset.

At some point in the future, Pinia will have support for Vuex's `strict` mode. Strict mode throws errors when store
changes occur outside of actions. Since strict mode doesn't exist in Pinia, yet, all clones are kept in
`Model.store.clonesById`. Changing a clone won't currently throw an error since there's no strict mode. Once Pinia
supports strict mode, Feathers-Pinia will be updated to keep copies outside of the store by default.

### `clone.commit(params)`

Calling `instance.commit()` will merge any changes from the clone onto the original record.

```ts
const task = api.service('tasks').new({ id: 1, description: 'Do something!' })
const taskCopy = task.clone()
taskCopy.description = 'Do something else!'
taskCopy.commit() // --> Update the data in the store.
console.log(task.description) // --> 'Do something else!'
console.log(taskCopy.description) // --> 'Do something else!'
```

### clone.reset(params)

To reset a clone to match the original instance, call `clone.reset()`.

```js
const task = api.service('tasks').new({ id: 1, description: 'Do something!' })
const taskCopy = task.clone()
taskCopy.description = 'Do something else!'
taskCopy.reset() // --> Resets the record to match the one in the store.
console.log(task.description) // --> 'Do something!'
console.log(taskCopy.description) // --> 'Do something!'
```
