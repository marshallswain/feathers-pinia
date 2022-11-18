---
outline: deep
---

<script setup>
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Starting a Vite Project

[[toc]]

## Overview

Follow these steps to get started with a new single-page Vite app:

1. [Create a Vue app with Vite](https://vitejs.dev/guide/#scaffolding-your-first-vite-project).
2. [Install Modules](./setup),
3. Follow the instructions, below

## 1. The Feathers Client

Feathers-Pinia supports multiple, simultaneous Feathers API servers. The process is the same with one exception: the name of the client must be unique and becomes the alias for that particular API server. Here's an example:

Here's an example **feathers-socket.io** client:

```ts
// src/feathers.ts
import { feathers } from '@feathersjs/feathers'
import socketio from '@feathersjs/socketio-client'
import auth from '@feathersjs/authentication-client'
import io from 'socket.io-client'

const socket = io('http://localhost:3030', { transports: ['websocket'] })

// This variable name becomes the alias for this server.
export const api = feathers()
  .configure(socketio(socket))
  .configure(auth({ storage: window.localStorage }))
```

For additional Feathers APIs, export another Feathers client instance with a unique variable name (other than `api`).

Here's an example that exports a couple of **feathers-rest** clients:

```ts
// src/feathers.ts
import { feathers } from '@feathersjs/feathers'
import rest from '@feathersjs/rest-client'
import auth from '@feathersjs/authentication-client'

const fetch = window.fetch.bind(window)

// The variable name of each client becomes the alias for its server.
export const api = feathers()
  .configure(rest('http://localhost:3030').fetch(fetch))
  .configure(auth())

export const analytics = feathers()
  .configure(rest('http://localhost:3031').fetch(fetch))
  .configure(auth())
```

:::tip
If upgrading from v4 (crow) and you receive this error "Error: Failed to execute 'fetch' on 'Window': Illegal invocation", make sure you bind the window to the fetch window.fetch.bind(window)
:::

## 2. Pinia

These few lines of code to setup pinia go in `/store/store.pinia.ts`. The `setupFeathersPinia` utility wraps `defineStore` and provides a global configuration (as long as you use the returned `defineStore`). It's not recommended to use a global configuration, like the below example, in SSR scenarios.

:::tip
Adding `.pinia.` to each store's filename will help disambiguate utilities from store setup. If you're upgrading a Vuex app, it helps distinguish which Vuex services haven't been upgraded, yet.
:::

```ts
// src/store/store.pinia.ts
import { createPinia } from 'pinia'
import { setupFeathersPinia } from 'feathers-pinia'
import { api } from '../feathers'

export const pinia = createPinia()

export const { defineStore, BaseModel } = setupFeathersPinia({
  clients: { api },
  idField: 'id',
})
```

The above snippet just provided the main `pinia` instance and a feathers client called `api` in the `clients` option. It also set the default `idField` to `id`. Now we won't have to set the `idField` at the service level.

The final step to setup `pinia` is to edit `src/main.ts` and use the `pinia` plugin:

```ts{5,7}
// src/main.ts
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { pinia } from './store/store.pinia'

createApp(App).use(pinia).mount('#app')
```

## 3. `useFeathers` Composable

Let's create a `useFeathers` composable that we can use to retrieve the plain Feathers client throughout the app.

```ts
// composables/feathers.ts
import { api } from '../feathers'

// Provides access to Feathers clients
export const useFeathers = () => {
  return { $api: api }
}
```

The above example imports the `api` object and returns it inside an object when you call `useFeathers`. For multiple clients, you can repeat the previous two steps with a different name than `api`.

We can make our composable much more useful if we utilize auto-imports. We can use [unplugin-auto-import](https://github.com/antfu/unplugin-auto-import) to enjoy Nuxt's auto-import feature in our Vite app. This example only gives us auto-imported composables and stores.

```ts{3,9-15}
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'

export default defineConfig({
  plugins: [
    Vue(),

    // https://github.com/antfu/unplugin-auto-import
    AutoImport({
      imports: ['vue', 'vue-router', 'vue-i18n', 'vue/macros', '@vueuse/head', '@vueuse/core'],
      dts: 'src/auto-imports.d.ts',
      dirs: ['src/composables', 'src/store'],
      vueTemplate: true,
    }),
  ]
})
```

Once you've installed the plugin using the instructions provided at the previous link, there will be no need to manually import
the `useFeathers` utility, giving you instant access to the `api` object whever you need it. It looks like this:

```ts
const { $api } = useFeathers()
```

With Feathers-Pinia, you rarely need the bare Feathers client, but when you do need it, it's only one line of code away. It's definitely convenient.

## 4. Service Stores

Now that we've created the main `pinia` store, we are ready to setup our services. Let's create two services and create
associations between them.

### 4.1 Users Service

The below example creates a `User` class and connects it to the `users` service.

```ts
// src/store/store.users.ts
import { defineStore, BaseModel } from './store.pinia'
import { api } from '../feathers'

// for associations
import { associateFind, type AssociateFindUtils } from 'feathers-pinia'
import { Task } from './store.tasks'

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

  // optional for setting up data objects and/or associations
  static setupInstance(data: Partial<User>) {
    associateFind(data as any, 'tasks', {
      Model: Task,
      makeParams: () => ({ query: { userId: data._id } }),
      handleSetInstance(task: Task) {
        task.userId = this._id
      },
    })
  }
}

const servicePath = 'users'
export const useUserStore = defineStore({
  servicePath,
  Model: User,
  state() {
    return {}
  },
  getters: {},
  actions: {},
})

api.service(servicePath).hooks({})
```

Notice the imports for setting up an `associateFind` with the `Task` model. Let's setup the `Task` model, next.

### 4.2 Tasks Service

The below example creates a `Task` class and connects it to the `tasks` service.

```ts
// src/store/store.users.ts
import { defineStore, BaseModel } from './store.pinia'
import { api } from '../feathers'

// for associations
import { associateGet } from 'feathers-pinia'
import { User } from './store.users'
import type { Id } from '@feathersjs/feathers'

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

  // optional for setting up data objects and/or associations
  static setupInstance(data: Partial<Task>) {
    associateGet(data as any, 'user', {
      Model: User,
      getId: () => data.userId as Id,
    })
  }
}

const servicePath = 'tasks'
export const useTaskStore = defineStore({
  servicePath,
  Model: User,
  state() {
    return {}
  },
  getters: {},
  actions: {},
})

api.service(servicePath).hooks({})
```

Notice the imports for setting up an `associateGet` with the `User` model. The `associateFind` and `associateGet` utilities are new in Feathers-Pinia v1. It's recommend that (once you finish setting up your app) you read the [Model Associations](/guide/model-associations) guide.

## 5. Authentication
