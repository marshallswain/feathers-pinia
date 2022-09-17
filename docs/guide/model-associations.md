---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Model Assocations <Badge>New in 1.0</Badge> 

[[toc]]

Learn about new utilities included with Feathers-Pinia that assist in cleanly managing associations between related data.

## New Utilities

Feathers-Pinia includes two new utilities for creating and managing associations between data:

- [**`associateFind`**](./associate-find.md) helps manage associated lists of records. (populate `user.messages` onto each `user`)
- [**`associateGet`**](./associate-get.md) helps manage an associated record. (for example, populating `message.user` onto each `message` object.)

If you would like to learn about the problems that arise when trying to associate data between stores, read the rest of this page.

Learn about **one-to-many** relationships on the [associateFind](./associate-find.md) page.<br/>
Learn about **one-to-one** relationships on the [associateGet](./associate-get.md) page.

## Problems With Assocations

Almost every application requires associating data between services. The relationship between data from the `/posts` service and from the `/users` service will be based on the "business" logic.  In other words, **business logic creates relevance for associations**. 

### Mixed Concerns

It's common to receive one type of data populated onto another. For example, a list of `posts` might arrive with each post having an associated `user`. If we allow the `user` to be put into the `post` store, we have mixed concerns: two types of data are combined into a single store. Depending on the complexity of our app, that **might** be acceptable. However, as soon as we need to query `users` from the store, mixed concerns are going to increase the cost of development.  We need the `user` data to be in the `users` store.

### Extra Work, Manual Population

## Solutions

### Populating in Components

This method doesn't take advantage of data modeling. Most Vue apps do not have an advanced data modeling layer, so the majority of Vue developers handle associations manually inside components. It generally lacks scalability because you end up repeating the same logic in many components.  The Vue Composition API helps with scalability, since you can cleanly create a composable utility and reuse it between components.  But it's still not as clean as data modeling, in general.

```ts
// TODO: Add Example
```

### Relating Through Memory

<Badge>Improved in 1.0</Badge>

One way to associate data is through JavaScript's memory pointers. When you store an object in a variable, the runtime stores a **reference** to the object, not the actual value. This means that you can store the same object under two different variable names. In the below example, `a` and `b` both contain a pointer to the same object in memory. Using the `===` operator checks if the variables point to the same location in memory:

```ts
const a = { id: 1, name: 'a' }
const b = a

expect(a === b).toBe(true)
```

There's a better way to accomplish associations, now, but Feathers-Pinia still supports memory-based assocations. The best place to create associations is in the `setupInstance` method.With the following `setupInstance` method, when a new `message` is created, if it holds a `user` object, the `user` will be moved into the `users` store:

```ts
import { User } from './users'

class Message extends BaseModel {
  text: string
  // Values added in `setupInstance` can be added to the interface for type friendliness.
  user?: Partial<User>

  constructor(data: Partial<SpeedingTicket> = {}) {
    super(data, options)
    this.init(data)
  }

  // convert a plain `user` object into a `User` instance
  // then add it to the store.
  setupInstance(message: Partial<Message>) {
    if (message.user) {
      message.user = new User(message.user).addToStore()
    }
  }
}
```

Support for the above type of assocation has been improved in version 1.0. Prior to 1.0, if you associated an item through memory then later received the same item in a patch response, the association would be lost. In 1.0, the associations will be maintained. However, if the entire `message` object is ever manually replaced in the store, the association will be lost.

### Relating Through Accessors

ES5 Accessors allow us to create virtual properties on a class. An ES5 "getter" is a better location for setting up a relationship. They have the benefit of being lazily evaluated when read, which prevents unnecessary processing.

```ts
import { User } from './users'

class Message extends BaseModel {
  text: string
  userId: number | string
  // Values added in `setupInstance` can be added to the interface for type friendliness.
  user?: Partial<User>

  constructor(data: Partial<SpeedingTicket> = {}) {
    super(data, options)
    this.init(data)
  }

  // convert a plain `user` object into a `User` instance and to store
  setupInstance(message: Partial<Message>) {
    if (message.user) {
      new User(message.user).addToStore()
      delete message.user
    }
  }

  // gives access the message.user through the `users` store.
  get user() {
    return User.getFromStore(this.userId)
  }
}
```

The advantage of using the above solution is that it does not depend on the two objects being associated through memory pointers. If the memory pointer is lost, the association will remain in place.

There are a few disadvantages to the above approach, too.  requires a few extra lines of code to give the same result. It also has a hidden problem: the `user` property is enumerable, which means it can be looped over when cloning and commiting. So in order for accessors to work, you have to specify a setter.

```ts
// gives access the message.user through the `users` store.
get user() {
  return User.getFromStore(this.userId)
}
// an empty setter allows clone and commit, while also being fugly
set user(val) {}
```

You can specify an empty setter, or you can specify a setter with some functionality in it to write new data to the association. Either way, it's extra lines of code for every associated property.

Another problem with enumerable properties is that they get serialized into requests to the server.  So when you save the `message`, the `user` object will go with it. That's rarely the desired outcome. We don't want the `messages` service on the API server to know how to save `users` data. That's just more tight coupling and mixed concerns.

#### Accessors Pros

- Decouple from the dependency on in-memory pointer associations.

#### Accessors Cons

- They're enumerable, which means
  - Requirements for clone and commit include specifying a setter.
  - They get serialized into API reqeusts.
- Empty setters are ugly.
- Useful setters require extra work.

### New Association Utils

<Badge>New in 1.0</Badge> 

The [associateFind](./associate-find.md) and [associateGet](./associate-get.md) utilities offer a consistent way to keep data in the appropriate store. They use a combination of all of the above solutions with some magic of their own to provide the following automatic benefits:

- **Loose Coupling** between stores.
- **Separation of Concerns** keeping data in the correct store.
- **Non-Enumerability** with some [Object.defineProperty](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) magic under the hood.
- **Clean API Requests** where associated data never goes to the wrong endpoint.
- **Clone and Commit Support** where defining a setter is optional.
- **Pagination Support** for lists, and a bunch of other utilities, since they're built on the same `Find` and `Get` classes that power [useFind](./use-find.md) and [useGet](./use-get.md).

And all of the functionality comes in a clean, short syntax:

```ts
import { BaseModel, associateFind, type AssociateFindUtils } from 'feathers-pinia'

export class User extends BaseModel {
  _id: string
  email = ''
  userId: null | number = null
  createdAt: Date | null = null

  // These are added by associateFind
  messages?: Array<Partial<User>> // reactive list of messages.
  _messages?: AssociateFindUtils<User> // Tools for querying and paginating messages.

  constructor(data?: Partial<Message>, options: Record<string, any> = {}) {
    super(data, options)
    this.init(data)
  }

  static setupInstance(user: Partial<Message>) {
    // access to `store` and `models` is from `this`.
    const { store, models } = this

    // adds a `messages` computed property and `_messages` utility object.
    associateFind(user, 'messages', {
      Model: models.api.Message,
      makeParams: (user) => {
        return { query: { id: user._id } }
      },
      handleSetInstance(user) {
        const id = user.getAnyId()
        if (id && !this.stargazerIds.includes(id)) this.stargazerIds.push(id)
      },
    })
  }
}
```

Learn about **one-to-many** relationships with [associateFind](./associate-find.md).<br/>
Learn about **one-to-one** relationships with [associateGet](./associate-get.md).
