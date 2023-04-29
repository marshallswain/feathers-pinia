---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
</script>

# BaseModel

[[toc]]

As explained in [Model Classes](./model-classes) Every service has its own `BaseModel` class. Here is an overview of its API.

## Constructor

When create new instances, the BaseModel's constructor accepts two arguments:

- `data {Object}` the instance data
- `options {ModelInstanceOptions}`

```ts
export interface ModelInstanceOptions {
  clone?: boolean
}
```

Feathers-Vuex users will notice that the options have been simplified. In Feathers-Pinia, creating a new instance does not automatically add that instance to the store. Most previous options were useful as workarounds when that feature was undesirable. With Feathers-Pinia, you manually add instances to the store with the `addToStore(instance)` method.

## Model Attributes

The following static attributes exist directly on the Model class:

- `store` - the Pinia store
- `pinia` - the `pinia` instance
- `servicePath` - the path where the Feathers service is registered.
- `idField` - the field that contains the unique identifier for this service.
- `tempIdField` - the field that contains a temporary id

There are also a few computed ES5 getters for tracking pending request status. These are only accurate when you use methods from the store or Model class. If you use the Feathers client, directly, it circumvents the actions that update these values.

- `isSavePending` - evaluates to true if there's a pending `create`, `patch`, or `update` request.
- `isCreatePending`
- `isPatchPending`
- `isUpdatePending`
- `isRemovePending`

## Static Methods

There are two unique static methods: `instanceDefaults` and `setupInstance`.

### `instanceDefaults`

The `instanceDefaults` method's purpose is to normalize default data for new instances created throughout the app. For Vue 2, it's required due to the limitations of Vue 2's reactivity layer. Vue 3's reactivity layer is more flexible, allowing a partial definition, if desired. Depending on the complexity of the service's "business logic", it can save a lot of boilerplate.

```ts
public static instanceDefaults(data, { models, store }): AnyInstanceData {}
```

- `data {Object}` - The instance data
- A `utils` object containing these props:
  - `store` - The vuex store
  - `models {Object}` The `globalModels` object, containing the models for all currently-registered services.

As an example, a User model class might have an `instanceDefaults` that looks like this:

```js
instanceDefaults(data, { store, models }) {
  return {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    isAdmin: false
  }
}
```

With the above attributes in place, you no longer have to manually specify any of the listed attributes. You can, however, provided data to replace them. Calling `new User({ firstName: 'Marshall' })` will create the instance with the `firstName` filled in, already.

One important note, the `isAdmin` attribute is specified in the above example in order to allow immediate binding in a form. You would pretty much NEVER allow specifying `isAdmin` from the client and storing it on the server. Attributes related to roles and app security should pretty much ALWAYS be written in hooks on the API server.

### `setupInstance`

This method allows you to transform the data and setup the final instance based on incoming data. For example, you can access the models object to reference other service Model classes and create data associations.

The function will be called during model instance construction with the following arguments and should return an object containing properties that'll be merged into the new instance.

```ts
public static setupInstance(data, { models, store }): AnyInstanceData {}
```

- `data {Object}` - The instance data
- A `utils` object containing these props:
  - `store` - The vuex store
  - `models {Object}` The `globalModels` object, containing the models for all currently-registered services.

For an example of how you might use `setupInstance`, suppose we have two services: Users and Posts. Assume that the API request to get a user includes their `posts` already populated on the data. The `instanceDefaults` allows us to convert the `posts` array into an array of `Post` instances.

> If you're looking for a great solution for populating data to work with Feathers-Pinia, check out [feathers-graph-populate](https://feathers-graph-populate.netlify.app/).

```js
// The setupInstance method on an imaginary User model.
setupInstance(data, { store, models }) {
  if (data.posts) {
    // Turn posts into an array of Post instances
    data.posts = data.posts.map(post => new models.api.Post(post))
  }
  return data
}
```

With the above `setupInstance` method in place, each `User` instance now stores a direct reference to the `Post` records in the posts store

Notice that `instanceDefaults` and `setupInstance` are similar. They have different purposes and are applied at different stages under the hood. The `instanceDefaults` method should ONLY be used to return default values for a new instance. Use`setupInstance`to handle other transformations on the data.

See more Model methods in the [Model Events section](#model-events).

## Proxy Static Methods

The majority of BaseModel's static methods are proxy methods to Actions and Getters in the store:

- `find(params)`: same as [store.find](./service-stores#find-params).
- `findInStore(params)`: same as [store.findInStore](./service-stores#findinstore-params).
- `count(params)`: same as [store.count](./service-stores#count-params).
- `countInStore(params)`: same as [store.countInStore](./service-stores#countinstore-params).
- `get(id, params)`: same as [store.get](./service-stores#get-id-params).
- `getFromStore(id, params)`: same as [store.getFromStore](./service-stores#getfromstore-id-params).
- `addToStore(data)`: same as [store.addToStore](./service-stores#addtostore-data).
- `update(id, data, params)`: same as [store.update](./service-stores.html#update-id-data-params)
- `patch(id, data, params)`: same as [store.patch](./service-stores.html#patch-id-data-params)
- `remove(id, params)`: same as [store.remove](./service-stores#remove-id-params).
- `removeFromStore(data)`: same as [store.removeFromStore](./service-stores#removefromstore-data).

## Model Events <Badge text="0.17.0+" />

Model classes are EventEmitter instances which emit service events when received (technically, EventEmitter methods are mixed onto each Model class). All FeathersJS events are supported. Oh, and one more thing: it works with `feathers-rest` (you won't receive socket events, but you can listen for when instances are created in other parts of the app.) BaseModel contains all EventEmitter.prototype properties and methods. [Read more about the `events` package on npm](https://npmjs.com/package/events).

Here’s an example of how to use it:

```js
import { useTodos } from '../store/todos'
import { onBeforeUnmount } from 'vue'

const todoStore = useTodos()

const handleTodoCreated = (todo) => {
  console.log(todo)
}
// Bind to all Model.created events
todoStore.Model.on(‘created’, this.handleTodoCreated)
// Unbind to prevent memory leaks.
onBeforeUnmount(() => {
  todoStore.Model.off(‘created’, this.handleTodoCreated)
})
```

Since they have all of the EventEmitter methods, Model classes can be used as a data-layer Event Bus. You can even use custom event names:

```js
const { Todo } = this.$FeathersVuex.api

Todo.on('custom-event', (data) => {
  console.log(data) // { test: true }
})

Todo.emit('custom-event', { test: true })
```

### Model.on <Badge text="0.17.0+" />

Register event handlers to listen to events.

### Model.once <Badge text="0.17.0+" />

Register an event handler that only occurs once.

### Model.off <Badge text="0.17.0+" />

Remove an event handler.
