# Model Instances

Using model instances is one of the strongest features available in Feathers-Pinia. Instances provide easy access to common methods **directly at the data level**. Essentially, each record has a common interface that allows you to write more succinct and featureful code.

## Creating Instances

Model instances come from Model classes, so to create an instance we need to obtain a class, first. One way to retrieve a class that works very well with Pinia is to pull it from the store, itself. This allows the store to show in the Pinia devtools. (A store won't show in the devtools until you `use` it inside of a component instance.)

```ts
import { useTodos } from '../store/todos'

// Now the todos store will show up in the pinia devtools.
const todoStore = useTodos()

// The model class is found at store.Model.
const Todo = todoStore.Model

const todo = new Todo({ description: 'Do the Dishes' })
```

One new feature of Feathers-Pinia is that it doesn't try to add every single instance to the store. You can have instances outside of the store. In the above example, `todo` is not yet in the store. We can still show it on screen and even bind to it in a form. Let's add it to the store.

```ts
todo.addToStore()
```

Wasn't that nice! The `addToStore` method is just hanging out there on the data, waiting to be used. It sure beats an ugly API like this:

```ts
// This doesn't actually exist. This API couples this component to the `feathers-pinia` module.
import { addToStore } from 'feathers-pinia'

addToStore(todo)
```

Every import in a component adds a tight coupling. You can't copy that component to another project without also installing the `feathers-pinia` dependency. But when you use an abstraction layer like putting methods directly on each instance, you only have a dependency on the method. The underlying implementation can change or be mocked very easily for tests.

Using instance methods for data is a supportive pattern in almost every scenario, especially when it comes to making API requests and managing store data. One huge benefit is that the common instance interface allows for making generic components that handle multiple types of data. The component doesn't have to know that it's dealing with a Todo or a User. It just knows that the records have a `.save()` method.

So let's dive into the common interface. Here's the instance API.

## Instance Methods

### `instance.addToStore()`

### `instance.save(params)`

The `save` method is a convenience wrapper for the `create/patch` methods, by default. If the records has no `_id` or `id`, the `instance.create()`method will be used. The`params` argument will be used in the Feathers client request. See the [Feathers Service](https://docs.feathersjs.com/guides/basics/services.html#service-methods) docs, for reference on where params are used in each method.

```ts
import { Todo } from '../stores/todos'
const todo = new Todo({ description: 'Do something!' })

todo.save() // --> Creates the todo on the server.
```

Once the `create` response returns, the record will have an `_id`. If you call `instance.save()` again, it will call `instance.patch()`. The method used depends solely on the data having an id (that matches the `options.idField` for this service).

> Note: Feathers-Pinia does not currently support `preferUpdate`, which was available in Feathers-Vuex. You can either call `.update()` instead of `save()` or open an issue stating that you need the feature.

### `instance.create(params)`=

The `create` method calls the `create` action (service method) using the instance data. The `params` argument will be used in the Feathers client request. See the [Feathers Service](https://docs.feathersjs.com/guides/basics/services.html#service-methods) docs, for reference.

You might not ever need to use `.create()`, but can instead use the `.save()` method. Let Feathers-Pinia call `create` or `patch`.

```js
import { Todo } from '../stores/todos'
const data = { description: 'Do something!' }
const todo = new Todo(data)

todo.create() // --> Creates the todo on the server using the instance data
```

### `instance.patch(params)`

The `patch` method calls the `patch` action (service method) using the instance data. The instance's id field is used for the `patch` id. The `params` argument will be used in the Feathers client request. See the [Feathers Service](https://docs.feathersjs.com/guides/basics/services.html#service-methods) docs, for reference.

Similar to the `.create()` method, you might not ever need to use `.patch()` if you just use `.save()` and let `feathers-vuex` figure out how to handle it.

```js
import { Todo } from '../stores/todos'
const todo = new Todo({ id: 1, description: 'Do something!' })
todo.description = 'Do something else'
todo.patch() // --> Sends a `patch` request the with the id and description.
```

You can provide an object as `params.data`, and Feathers-Pinia will use it as the patch data. This allows patching with partial data:

```js
import { Todo } from '../stores/todos'
const todo = new Todo({ description: 'Do Something', isComplete: false })
todo.patch({ data: { isComplete: true } })
```

### `instance.update(params)`

The `update` method calls the `update` action (service method) using the instance data. The instance's id field is used for the `update` id. The `params` argument will be used in the Feathers client request. See the [Feathers Service](https://docs.feathersjs.com/guides/basics/services.html#service-methods) docs, for reference.

Use `.update()` whenever you want to completely replace the data on the server with the instance data.

```js
import { Todo } from '../stores/todos'
const todo = new Todo({ id: 1, description: 'Do something!' })
todo.description = 'Do something else'
todo.update() // --> Sends a `update` request the with all instance data.
```

### `instance.remove(params)`

The `remove` method calls the `remove` action (service method) using the instance data. The instance's id field is used for the `remove` id. The `params` argument will be used in the Feathers client request. See the [Feathers Service](https://docs.feathersjs.com/guides/basics/services.html#service-methods) docs, for reference.

```js
import { Todo } from '../stores/todos'
const todo = new Todo({ id: 1, description: 'Do something!' })
todo.save().then((todo) => {
  todo.remove() // --> Deletes the record from the server
})
```

### `instance.clone(params)`

The `.clone()` method creates a deep copy of the record and stores it on `store.copiesById`. This allows you to make changes to the clone and not update visible data until you commit or save the data.

```ts
import { Todo } from '../stores/todos'
const todo = new Todo({ id: 1, description: 'Do something!' })
const todoCopy = todo.clone()
todoCopy.description = 'Do something else!'
todoCopy.commit() // --> Update the data in the store.
console.log(todo.description) // --> 'Do something else!'
console.log(todoCopy.description) // --> 'Do something else!'
```

Calling `clone()` at any time will copy the data from the original to the clone, essentially performing a reset.

At some point in the future, Pinia will have support for Vuex's `strict` mode. It throws errors if any changes occur in the Vuex store `state` outside of mutations. Since strict mode doesn't exist in Pinia, yet, all clones are kept in `store.clonesById`. Changing a clone won't throw an error since there's no strict mode. Once Pinia supports strict mode, Feathers-Pinia will be updated to keep copies outside of the store by default.

### `instance.commit(params)`

Calling `instance.commit()` will copy any changes from the clone to the original record.

```ts
import { Todo } from '../stores/todos'
const todo = new Todo({ id: 1, description: 'Do something!' })
const todoCopy = todo.clone()
todoCopy.description = 'Do something else!'
todoCopy.commit() // --> Update the data in the store.
console.log(todo.description) // --> 'Do something else!'
console.log(todoCopy.description) // --> 'Do something else!'
```

## Reset an Instance

To reset an instance, call `.clone()` on it again.

```js
import { Todo } from '../stores/todos'
const todo = new Todo({ id: 1, description: 'Do something!' })
const todoCopy = todo.clone()
todoCopy.description = 'Do something else!'
todoCopy.clone() // --> Resets the record to match the one in the store.
console.log(todo.description) // --> 'Do something!'
console.log(todoCopy.description) // --> 'Do something!'
```
