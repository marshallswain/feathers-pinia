---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Model Instances

[[toc]]

Each Model Function receives an object and upgrades it to be a model instance. The instance
API will be different depending on the type of Model Function used.

## Why Model Instances

Using model instances enables some of the most-useful code patterns in Feathers-Pinia. Instances provide easy access to
common methods **directly at the data level**. Essentially, each record has a common interface that allows you to write
more succinct and useful code. These interfaces work as an abstraction layer and allow us to keep our code loosely
coupled.

### Interface Super Powers

Model instances are created by passing an object to a Model Function. Assuming you've created
a Model Function, creating an instance is as easy as calling the function with some data:

```ts
import { Task } from '../models/task'

const task = Task({ description: 'Do the Dishes' })
```

<BlockQuote label="notice">
You no longer use the `new` operator to create a model instance.
</BlockQuote>

Feathers-Pinia doesn't try to add every single instance to the store. You can have instances outside of the store. In
the above example, `task` is not in the Model's store. We can still show it on screen and even bind to it in a form. The
standalone nature of instances makes them more flexible.

Let's add the task to the Model's store:

```ts
task.createInStore()
```

Wasn't that nice! The `createInStore` method is just hanging out there on the data, ready to be used.

### Decoupling from Modules

The previous section showed how instances have a convenient `createInStore` method on them. In most cases this type of
API is far more convenient than a verbose API like the one in this next example:

```ts
// This type of API couples this code to the `feathers-pinia` module
// This doesn't actually exist. 
import { createInStore } from 'feathers-pinia'

createInStore(todo)
```

Every import in a component adds a tight coupling. You can't copy that component to another project without also
installing the `feathers-pinia` dependency. But when you use an abstraction layer like putting methods directly on each
instance, you are only coupled to the method. The underlying implementation can change or be mocked very easily for
testing purposes.

Using instance methods for data is a supportive pattern in almost every scenario, especially when it comes to making API
requests and managing store data. One huge benefit to the instance interface is that it allows creation of generic
components that handle multiple types of data. The component doesn't have to know that it's dealing with a Todo or a
User. It just knows that the records have a `.save()` method.

## Model Instance Types

Each of the two Model Functions produces a different interface on each instance.

## Compare Instance APIs

Each object that passes through a Model Function will have several properties added to it. Here's a comparison of the
properties added to each record by Model type.

::: code-group

```js [BaseModel instances]
// model function and name
__Model
__modelName

// ids
__idField
__tempId

// storage
createInStore()
removeFromStore()

// clone and commit
__isClone
clone()
commit()
reset()
```

```js [FeathersModel instances]
// model function and name
__Model
__modelName

// ids
__idField
__tempId

// storage
createInStore()
removeFromStore()

// clone and commit
__isClone
clone()
commit()
reset()

// FeathersModel methods
save()
create()
patch()
remove()
```

:::
