---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Model Assocations <Badge>New in 2.0</Badge>

[[toc]]

Learn about new utilities included with Feathers-Pinia that assist in cleanly managing associations between related
data.

## New Utilities

Feathers-Pinia includes two new utilities for creating and managing associations between data:

If you would like to learn about the problems that arise when trying to associate data between stores, read the rest of
this page.

The rest of this page covers challenges and potential solutions when populating data. Jump to the
[last section](#new-association-utils) for the optimal solution.

## Problems With Assocations

Almost every application requires associating data between services. The relationship between data from the `/posts`
service and from the `/users` service will be based on the "business" logic.  In other words, **business logic creates
relevance for associations**.

### Mixed Concerns

It's common to receive one type of data populated onto another. For example, a list of `posts` might arrive with each
post having an associated `user`. If we allow the `user` to be put into the `post` store, we have mixed concerns: two
types of data are combined into a single store. Depending on the complexity of our app, that **might** be acceptable.
However, as soon as we need to query `users` from the store, mixed concerns are going to increase the cost of
development. We need the `user` data to be in the `users` store.

### Extra Work, Manual Population

Manual population in (perhaps poorly-designed) modern apps is regularly done inside of components. There are situations
where it's fine to do so, but it's not a practice that would generally be considered maintainable over the long term
because it requires lots of extra work.

In those situations where it does make sense, Feathers-Pinia's querying utilities really work well. Most associations
between data can be defined by a Feathers Query, so it makes sense to simplify the process of relating data through the
Feathers Query syntax.

If you've already pulled data from the server, you could just use the Model's `getFromStore` and `findInStore` method to
grab the data that you want. It's really quite simple when you're "populating" data for a single record. Let's take a
look at some pretend component logic. It's pretty clean to pull in stored data.

```ts
import { User, Post } from '../models'

interface Props {
  userId: string | number
}
const props = defineProps<Props>()

const user = User.getFromStore(props.userId)
const posts = Post.findInStore({ query: { userId: props.userId } })
```

It becomes slightly more complex when you need to do this process for more users, but still looks pretty clean. Now our
component receives a list of `userIds` and retrieves `users` and a big list of `posts` which could belong to any of the
matching users.

```ts
import { User, Post } from '../models'

interface Props {
  userIds: Array<string | number>
}
const props = defineProps<Props>()

const users = User.findInStore({ query: { id: { $in: props.userIds } } })
const posts = Post.findInStore({ query: { userId: { $in: props.userIds } } })
```

That's still pretty clean, but what if the requirement is to directly populate the `posts` data **onto** each `user`
record? How do you approach that? The quick and dirty way would be to assign `user.posts`. The problem with that
approach is that when you call `user.save()`, the `posts` data gets sent to the `/users` endpoint on accident.

## Solutions

### Populating in Components

We already saw two examples of populating data inside of a component. This manner of populating doesn't take advantage
of data modeling. Most Vue apps do not have an advanced data modeling layer, so the majority of Vue developers handle
associations manually inside components. It generally lacks scalability because you end up repeating the same logic in
many components.  The Vue Composition API helps with scalability, since you can cleanly create a composable utility and
reuse it between components.  But it's still not as clean as what you can achieve through data modeling.

### Relating Through Memory

<Badge>Improved in 2.0</Badge>

One way to associate data is through JavaScript memory pointers. When you store an object in a variable, a **reference**
to the object is stored, not the actual value. This means that you can store the same object under two different
variable names. In the below example, `a` and `b` both contain a pointer to the same object in memory. Using the `===`
operator checks if the variables point to the same location in memory:

```ts
const a = { id: 1, name: 'a' }
const b = a

expect(a === b).toBe(true)
```

There's a better way to accomplish associations, now, but Feathers-Pinia still supports memory-based assocations. The
best place to create associations is in the Model function. In the following example, when a new `message` is created,
if it holds a `user` object, the `user` will be moved into the `users` store while still maintaining the association.

```ts
import { User } from './users'

const modelFn = (data: ModelInstance<Messages>) => {
  if (data.user) {
    data.user = User(data.user).createInStore()
  }
  const withDefaults = useInstanceDefaults({ text: '' }, data)
  return withDefaults
}
```

Support for in-memory assocations has been improved in version 2.0. Previously, if you associated an item through memory
then later received the same item in a patch response, the association would be lost. In 2.0, the associations will be
maintained. However, if the entire `message` object is ever manually replaced in the store, the association will be
overwritten as well.

### Relating Through Accessors

ES5 Accessors allow us to create virtual properties on a class. An ES5 "getter" is a better location for setting up a
relationship. They have the benefit of being lazily evaluated when read, which prevents unnecessary processing.

```ts
import { User } from './users'

const modelFn = (data: ModelInstance<Messages>) => {
  if (message.user) {
    // convert a plain `user` object into a `User` instance and add to store
    User(message.user).createInStore()
    delete message.user

    // access the user through the `users` store.
    Object.assign(data, {
      get user() {
        return User.getFromStore(this.userId)
      }
    })
  }
  const withDefaults = useInstanceDefaults({ text: '', userId: null }, data)
  return withDefaults
}
```

The advantage of using an ES5 getter is that it will persist in situations when a memory pointer association would have
been lost.

There are a few disadvantages to the above approach, too. It's a bit verbose for a solution that handles a single
relationship. It also has a hidden problem: the `user` property is enumerable, which means it can be looped over when
cloning and committing. In order for accessors to work, you might choose to specify an empty setter, like this:

```ts
// gives access the message.user through the `users` store.
get user() {
  return User.getFromStore(this.userId)
}
// an empty setter allows clone and commit, while also being fugly
set user(val) {}
```

Alternatively, you could use the `Object.defineProperty` method to declare the attribute as `enumerable: false`. Either
solution is more verbose.

Another problem with enumerable properties is that they get serialized into requests to the server.  So when you save
the `message`, the `user` object will go with it. That's rarely the desired outcome. We don't want the `messages`
service on the API server to know how to save `users` data. That's just more tight coupling and mixed concerns.

#### Accessors Pros

- Decouple from the dependency on in-memory pointer associations.

#### Accessors Cons

- They're enumerable when using `Object.assign`, which means
  - Requirements for clone and commit include specifying a setter.
  - They get serialized into API reqeusts.
- Empty setters are ugly.
- Useful setters require extra work.

### New Association Utils

<Badge>New in 2.0</Badge>

The associateFind and associateGet utilities offer a consistent way to keep
data in the appropriate store. They use a combination of all of the above solutions with some magic of their own to
provide the following automatic benefits:

- **Loose Coupling** between stores.
- **Separation of Concerns** keeping data in the correct store.
- **Non-Enumerability** with some [Object.defineProperty](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) magic under the hood.
- **Clean API Requests** where associated data never goes to the wrong endpoint.
- **Clone and Commit Support** where defining a setter is optional.
- **Pagination Support** for lists, and a bunch of other utilities, since they're built on the same `Find` and `Get`
classes that power [useFind](/services/use-find) and [useGet](/services/use-get).

And all of the functionality comes in a clean, short syntax. Here's an example of `associateGet` that populates the user
onto each message:

```ts
import type { Messages } from 'my-feathers-api'
import { type ModelInstance, useInstanceDefaults, associateGet } from 'feathers-pinia'
import { User } from './user'

const modelFn = (data: ModelInstance<Messages>) => {
  const withDefaults = useInstanceDefaults({ text: '', userId: null }, data)
  const withUser = associateFind(withDefaults, 'user', {
    Model: User,
    getId: (data) => data.messageId
  })
  return withUser
}
```

And here's an example of using `associateFind` to populate `messages` onto each `user`.

```ts
import type { Users } from 'my-feathers-api'
import { type ModelInstance, useInstanceDefaults, associateFind } from 'feathers-pinia'
import { Message } from './message'

const modelFn = (data: ModelInstance<Users>) => {
  const withDefaults = useInstanceDefaults({ email: '', password: '' }, data)
  const withMessages = associateFind(withDefaults, 'messages', {
    Model: Message,
    makeParams: (data) => ({ query: { userId: data.id } }),
    handleSetInstance(message) {
      message.userId = data.id
    },
  })
  return withMessages
}
```

Learn about **one-to-many** relationships with associateFind.<br/>
Learn about **one-to-one** relationships with associateGet.
