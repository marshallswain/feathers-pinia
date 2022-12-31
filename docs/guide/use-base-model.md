---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# BaseModel Functions

[[toc]]

In Feathers-Pinia 2.0, the `BaseModel` concept has changed.  It's no longer a class, and it no longer includes Feathers
functionality, by default. Look at [FeathersModel](/guide/use-feathers-model) for an API like the old BaseModel class.
Keep reading for an overview of BaseModel Functions.

**Related reading:**

- [BaseModel Instance API](/guide/use-base-model-instances)
- [BaseModel Store API](/guide/use-base-model-stores)

## Create BaseModel Functions

To create a BaseModel function, you start with a plain function. The function receives an object and returns a
modified form of that same object. You then pass an options object and the function you created as arguments to the
`useBaseModel` utility. The result is a `BaseModel` function that gives your data super powers!

If you want TypeScript types to work, you must provide the generics in this order:

- ServiceResult
- ServiceQuery
- `typeof Model`

<!--@include: ./types-notification.md-->

```ts
import type { Tasks, TasksData, TasksQuery } from 'my-feathers-api'
import { type ModelInstance, useBaseModel, useInstanceDefaults } from 'feathers-pinia'

const modelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({ description: '', isComplete: false }, data)
  return withDefaults
}
const Task = useBaseModel<Tasks, TasksQuery, typeof modelFn>({ name: 'Task', idField: '_id' }, modelFn)
```

### useBaseModel(options, Model)

- `options {Object}`
  - `name {string}` the name of the Model function. Best to make it unique. **Required**
  - `idField {string}` the name of the field containing each instance's unique identifier. **Required**
  - `whitelist {string[]}` extra query params to be allowed when querying the local data store.
- `modelFn` a function that receives a `ModelInstance`object and returns a modified version of that object.

## Model Store

The following static attributes exist directly on BaseModel Functions:

- `store` the internal Model store, which can be replaced by using `setStore`.
- `setStore(store)` allows replacing the internal Model.store. If the store has a `setModel` function, the model will
call it with itself as the argument.

See [Model Stores](/guide/model-stores) for more information.

## Proxy Static Methods

A few store methods are proxied directly onto BaseModel's static interface:

- `findInStore(params)`
- `countInStore(params)`
- `getFromStore(id, params)`
- `addToStore(data)`
- `removeFromStore(data)`

Read more about these methods in the [BaseModel Store API](/guide/use-base-model-stores#storage)

View the [Static Interface Comparison](/guide/model-functions#compare-static-properties) of BaseModel and FeathersModel.

## Model Events

Model Functions are EventEmitter instances which emit service events when received (technically, EventEmitter methods
are mixed onto each Model Function). All FeathersJS events are supported. Oh, and one more thing: it works with
`feathers-rest` (you won't receive socket events, but you can listen for when instances are created in other parts of
the app.) BaseModel contains all EventEmitter.prototype properties and methods.
[Read more about the `events` package on npm](https://npmjs.com/package/events).

Here’s an example of how to use it:

<!--@include: ./types-notification.md-->

```ts
import type { Tasks, TasksData, TasksQuery } from 'my-feathers-api'
import { type ModelInstance, useBaseModel, useInstanceDefaults } from 'feathers-pinia'

const modelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({ description: '', isComplete: false }, data)
  return withDefaults
}
const Task = useBaseModel<Tasks, TasksQuery, typeof modelFn>({ name: 'Task', idField: '_id' }, modelFn)

const handleTodoCreated = (todo) => {
  console.log(todo)
}
// Bind to all Task.created events
Task.on(‘created’, this.handleTodoCreated)
// Unbind to prevent memory leaks.
onBeforeUnmount(() => {
  Task.off(‘created’, this.handleTodoCreated)
})
```

Since they have all of the EventEmitter methods, Model classes can be used as a data-layer Event Bus. You can even use
custom event names:

```js
Task.on('custom-event', (data) => {
  console.log(data) // { test: true }
})

Task.emit('custom-event', { test: true })
```

### Model.on

Register event handlers to listen to events.

### Model.once

Register an event handler that only occurs once.

### Model.off

Remove an event handler.
