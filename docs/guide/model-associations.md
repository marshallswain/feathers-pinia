---
outline: deep
---

# Model Assocations

[[toc]]

<script setup>
import BlockQuote from '../components/BlockQuote.vue'
</script>

In almost every application, there will be a need to associate one type of data to another type of data. How the data from the `/posts` service relates to the data from the `/users` service will be based on the business logic.  In other words, **business logic creates relevance for associations**.

Feathers-Pinia allows you to keep data in the appropriate store. Consider a scenario where you load a user's record an API server and it arrives with some populated `messages` property, like this:

```ts
const user = await userService.get(1)
const { id, name, messages } = user
```

How would you model this data?  One way would be to define it on the model as an array. The problem with that approach is that the messages aren't actually stored on the user, they're loaded from the `messages` service. We need a way to automatically move the related data into the store.

## Creating Assocations

Feathers-Pinia is unique compared to most ORMs and association schemas you've previously seen. With Feathers-Pinia, you think of associations in terms of the Feathers Query Language rather than as a set of "primary" and "foreign" keys. Also, instead of defining relationships using a set of declarative properties, you'll enjoy the flexibility of using a set of declarative functions.

There are two utilities that help with modeling associations between Model classes: [`associateFind`](#associatefind) and [`associateGet`](#associateget). Both of them work inside a Model class's [`setupInstance`](./base-model#setupinstance) function. Let's see how they work!

## `associateFind`

The `associateFind` utility allows you to setup a one-to-many assocation inside of a Model class's `setupInstance` method.

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

## `associateGet`
