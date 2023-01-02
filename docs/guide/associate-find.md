---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
import V2Block from '../components/V2Block.vue'
</script>

<V2Block />

# associateFind

[[toc]]

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
