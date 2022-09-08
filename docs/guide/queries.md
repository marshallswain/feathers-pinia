---
outline: deep
---

# Queries

```ts
// src/feathers.ts
import feathers, { HookContext } from '@feathersjs/feathers'
import rest from '@feathersjs/rest-client'

```

```ts
import { setupFeathersPinia, BaseModel } from 'feathers-pinia'
import { createPinia } from 'pinia'
import { api } from '../feathers'

const pinia = createPinia()
const { defineStore } = setupFeathersPinia({ clients: { api } })

export class User extends BaseModel {
  _id: number
  name: string

  messages?: Partial<Message>[]
  findMessages?: any

  constructor(user: Partial<User> = {}, options: Record<string, any> = {}) {
    super(user, options)
    this.init(user)

    const { store, models } = this.Model

    associateFind(user, 'messages', {
      Model: models.api.Message,
      makeParams: (user) => {
        return { query: { userId: user._id } }
      },
    })
  }
}
const users = [
  { id: 1, name: 'Myriah' },
  { id: 2, name: 'Marshall' },
]

export class Message extends BaseModel {
  _id: number
  text = 'foo'
  userId: null | number
  createdAt: Date | null

  user?: Partial<User> | null
  getUser?: any

  constructor(message: Partial<Message> = {}, options: Record<string, any> = {}) {
    super(message, options)
    this.init(message)

    const { store, models } = this.Model

    associateGet(message, 'user', {
      Model: models.api.User,
      makeParams: (message) => {
        return { query: { id: message.userId } }
      },
    })
  }
}
const messages = [
  { id: 1, text: '🙂', userId: 1 },
  { id: 2, text: '😊', userId: 2 },
  { id: 3, text: 'Hey', userId: 1 },
  { id: 4, text: 'Hey', userId: 2 },
  { id: 5, text: 'Hey what?', userId: 1 },
  { id: 6, text: 'You said hey, first', userId: 2 },
  { id: 7, text: '🥐', userId: 1 },
]
```

```vue
<script setup lang="ts">
const user1 = 
</script>

<template>

</template>
```
