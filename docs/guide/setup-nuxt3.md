---
outline: deep
---

<script setup>
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Nuxt 3

[[toc]]

Take advantage of Nuxt 3's auto-imports and enjoy the best developer experience with Feathers-Pinia by following these instructions. For the TLDR (Too Long, Didn't Read) version, you can take a look at the [feathers-pinia-nuxt3 repo](https://github.com/marshallswain/feathers-pinia-nuxt3).

## Overview

Follow these steps to get started with a new single-page Vite app:

1. Create a Nuxt app
   - [Use the starter project]() and read the below as reference.
   - [Start a new Nuxt app](https://v3.nuxtjs.org/getting-started/installation) and follow the below as instructions.
2. [Install Modules](./setup), 
3. Follow the instructions, below.

<BlockQuote>

Note that for auto-import to work in Nuxt 3, the dev server must run. The dev server builds out the internal TypeScript types for you, making it really convenient to work in Nuxt 3.

</BlockQuote>

## 1. Install OhMyFetch

The `ohmyfetch` adapter fulfills the promise of the `fetch` API, being a universal client that works on client, server, and in serverless environments.  Install it with the following command.  Note that you can put it in `devDependencies` since Nuxt makes a clean, standalone version of your project during build.

```bash
npm i ohmyfetch -D
```

## 2. Feathers Client Plugin

With `ohmyfetch` installed, you can use the `OhMyFetch` adapter from Feathers-Pinia to setup a Feathers client. The following example shows how to setup a hybrid client that uses `fetch` on the server and seamlessly switches to WebSockets on the client.  Yes! Feathers-Pinia is capable of switching client transports and will continue to work seamlessly!

```ts
// plugins/feathers.ts
import auth from '@feathersjs/authentication-client'
import { $fetch } from 'ohmyfetch'
import rest from '@feathersjs/rest-client'
import socketio from '@feathersjs/socketio-client'
import io from 'socket.io-client'
import { feathers } from '@feathersjs/feathers'
import { OhMyFetch, setupFeathersPinia } from 'feathers-pinia'

export default defineNuxtPlugin(async (_nuxtApp) => {
  // Creating the Feathers client in a plugin avoids stateful data and
  // prevents information from leaking between user sessions.
  const api = feathers()
  const { defineStore } = setupFeathersPinia({
    ssr: !!process.server,
    clients: { api },
    idField: '_id',
    // customize every store
    state: () => ({}),
    getters: {},
    actions: {},
  })

  const host = import.meta.env.VITE_MYAPP_API_URL as string || 'http://localhost:3030'

  // Use Rest on the server
  // Check process.server so the code can be tree shaken out of the client build.
  if (process.server)
    api.configure(rest(host).fetch($fetch, OhMyFetch))

  // Switch to Socket.io on the client
  else
    api.configure(socketio(io(host, { transports: ['websocket'] })))

  api.configure(auth())

  return {
    provide: { api, defineStore },
  }
})
```

## 3. `useFeathers` Composable

Notice how the last line in the previous example returns `api` and `defineStore` in the `provide` key of the returned object. This adds respective `$api` and `$defineStore` keys to the NuxtApp context when you call `useNuxtApp`. To better separate concerns, let's create a `useFeathers` composable that we can use to retrieve the plain Feathers client throughout the app.

```ts
// composables/feathers.ts

// Provides access to Feathers clients
export const useFeathers = () => {
  const { $api } = useNuxtApp()
  return { $api }
}
```

The above example pulls the `$api` object from `useNuxtApp` and returns it inside another object. For multiple clients, you can repeat the previous two steps with a different name than `api`. With the above composable in place, we can now call the following in any component to access the Feathers client!

```ts
const { $api } = useFeathers()
```

With Feathers-Pinia, you rarely need the bare Feathers client, but when you do need it, it's only one line of code away. It's definitely convenient.

## 4. Model Classes

In Nuxt 3, we keep our Model classes in their own directory, separate from the service store setup. For this example setup we will show two Models: a `User` class and a `Task` class. Each one shows a different example of setting up a relationship with the other by using `associateFind` and `associateGet`. 

### 4.1. User Class Example

Here's the `User` Model with the `associateFind` utility:

```ts
// models/user.ts
import type { AssociateFindUtils } from 'feathers-pinia'
import { BaseModel, associateFind } from 'feathers-pinia'
import type { Task } from './task'

export class User extends BaseModel {
  _id?: string
  name = ''
  email = ''
  password = ''

  tasks?: Task[]
  _tasks?: AssociateFindUtils<Task>

  // Minimum required constructor
  constructor(data: Partial<User> = {}, options: Record<string, any> = {}) {
    super(data, options)
    this.init(data)
  }

  static setupInstance(user: Partial<User>) {
    const { Task } = useTasks()

    associateFind(user as any, 'tasks', {
      Model: Task,
      makeParams: () => ({ query: { userId: user._id } }),
      handleSetInstance(task: typeof Task) {
        (task as any).userId = this._id
      },
    })
  }
}
```

<BlockQuote>

The most important part of setting up associations is to reference the service stores inside of `setupInstance`. In the above example, the line `const { Task } = useTasks()` is referencing a service store composable which we will setup, soon. Referencing the service stores inside of `setupInstance` allows for lazy initialization of stores between Model classes. It's super convenient!

</BlockQuote>

### 4.2. Task Class Example

Now here's the `Task` Model with the `associateGet` utility:

```ts
// models/task.ts
import type { Id } from '@feathersjs/feathers/lib'
import { BaseModel, associateGet } from 'feathers-pinia'
import type { User } from './user'

export class Task extends BaseModel {
  _id?: string
  description = ''
  isCompleted = false
  userId = ''

  user?: User

  // Minimum required constructor
  constructor(data: Partial<Task> = {}, options: Record<string, any> = {}) {
    super(data, options)
    this.init(data)
  }

  static setupInstance(task: Partial<Task>) {
    const { User } = useUsers()

    associateGet(task as any, 'user', {
      Model: User,
      getId: () => task._id as Id,
    })
  }
}
```

Note that the `Task` Model, above, references associated classes inside `setupInstance` in the same way that the `User` class did.  With the two Model classes in place, we're ready to setup the service stores.

For more information about setting up associations, see the [Model Associations](./model-associations) page.

<BlockQuote type="danger" label="Attention">

Never import and use the Models, directly, other than through the composables which will be created in the next step. Direct use will result in errors and the only fix is to use Model classes properly through the composables.

</BlockQuote>


## 5. Service Stores

In Nuxt 3, the user stores are setup as auto-imported composables, making them really convenient to use.  (If you haven't noticed, yet, one of the primary themes of Nuxt 3 is convenient Developer Experience.)

### 5.1 The Users Service

To setup the `/users` service store, create the following file:

```ts
// composables/service.users.ts
import { User } from '~/models/user'

export const useUsers = () => {
  const { $api, $defineStore, $pinia } = useNuxtApp()

  const servicePath = 'users'
  const useStore = $defineStore({
    servicePath,
    Model: User,
    state() {
      return {}
    },
    getters: {} as any,
    actions: {} as any,
  })
  const store = useStore($pinia)

  $api.service(servicePath).hooks({})

  return {
    userStore: store,
    User: User as typeof store.Model,
  }
}
```

With the above file in place, you can call `const { User, userStore } = useUsers()` from any component to get access to the store.

<BlockQuote>

Note that we currently have to cast the `User` model into `typeof userStore.Model`. For now, casting is required.

</BlockQuote>

### 5.2 The Tasks Service

To setup the `/tasks` service store, create the following file:

```ts
// composables/service.tasks.ts
import { Task } from '~/models/task'

export const useTasks = () => {
  const { $api, $defineStore, $pinia } = useNuxtApp()

  const servicePath = 'tasks'
  const useStore = $defineStore({
    servicePath,
    Model: Task,
    state() {
      return {}
    },
    getters: {} as any,
    actions: {} as any,
  })
  const store = useStore($pinia)

  $api.service(servicePath).hooks({})

  return {
    taskStore: store,
    Task: Task as typeof store.Model,
  }
}
```

With the above files in place, we're ready to start using them in components!

## 6. Using Stores in components

Here's a basic component showing how to reference a store and start creating:

```vue
<script setup lang="ts">
const { User, userStore } = useUsers()

const findData = userStore.useFind({ query: {}, onServer: true })
const { users } = findData

const user = new User({ email: 'foo', _id: 'bar' }).addToStore()
</script>

<template>
  <div>
    <h1>Home</h1>

    <p>{{ user }}</p>
    
    <!-- List of the user's tasks -->
    <ul>
      <li v-for="task in user.tasks" :key="task._id">{{ task.description }}</li>
    </ul>

    <!-- List of users returned by userStore.useFind() -->
    <ul>
      <li v-for="user in users" :key="user._id">{{ user.name }}</li>
    </ul>
  </div>
</template>
```