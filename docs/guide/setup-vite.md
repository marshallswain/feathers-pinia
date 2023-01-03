---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import pkg from '../../package.json'
import BlockQuote from '../components/BlockQuote.vue'
</script>

<div style="position: fixed; z-index: 1000; top: 2px; right: 2px;">
  <Badge :label="`v${pkg.version}`" />
</div>

# Starting a Vite Project

<BlockQuote type="danger" label="Outdated Content">

🚧 Not updated for v2, yet. 🚧

This page is currently being updated.

</BlockQuote>

[[toc]]

## Overview

Follow these steps to get started with a new single-page Vite app:

1. [Create a Vue app with Vite](https://vitejs.dev/guide/#scaffolding-your-first-vite-project).
2. [Install Modules](./setup),
3. Follow the instructions, below

## 1. Feathers Client

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

## 4. Model Classes

The next step is to begin data modeling with Model classes.  Model classes get their own directory, separate from the service store setup, which enables us to use auto-imports without errors. For this example setup we will show two Models: a `User` class and a `Task` class. Each one shows a different example of setting up a relationship with the other by using `associateFind` and `associateGet`.

### 4.1. User Class Example

Here's the `User` Model with the `associateFind` utility:

```ts
// models/user.ts
import { BaseModel } from '../store/store.pinia'
import { associateFind, type AssociateFindUtils } from 'feathers-pinia'
import { Task } from './task'

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
```

<BlockQuote>

It's important that you do not reference the service stores inside of Model classes `setupInstance`. In the above example, the line `import { Task } from './task.ts'` pulls in a related model.

</BlockQuote>

### 4.2. Task Class Example

Now here's the `Task` Model with the `associateGet` utility:

```ts
// models/task.ts
import type { Id } from '@feathersjs/feathers'
import { BaseModel } from '../store/store.pinia'
import { associateGet } from 'feathers-pinia'
import { User } from './user'

export class Task extends BaseModel {
  _id?: string
  description = ''
  isCompleted = false
  userId = ''

  user?: typeof User

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
```

Note that the `Task` Model, above, references associated classes inside `setupInstance` in the same way that the `User`
class did, and it's really nice that the underlying tooling allows circular imports, now.  With the two Model classes in
place, we're ready to setup the service stores.

For more information about setting up associations, see the [Model Associations](./model-associations) page.

## 5. Service Stores

Now that we've created the main `pinia` store, we are ready to setup our services. We'll create a `users` service and a
`tasks` service which use the Model classes we created, earlier. We'll wrap them like a composable to make them easier
to access from the rest of the app.

### 5.1 Users Service

The below example imports the `User` model and connects it to the `users` service.

```ts
// src/store/store.users.ts
import { defineStore, pinia } from './store.pinia'
import { User } from '../models/user'

export const useUserStore = () => {
  const { $api } = useFeathers()
  const servicePath = 'users'
  const useStore = defineStore({
    servicePath,
    Model: User,
    state() {
      return {}
    },
    getters: {},
    actions: {},
  })
  const store = useStore(pinia)

  $api.service(servicePath).hooks({})

  return {
    userStore: store,
    User: User as typeof store.Model,
  }
}
```

Next, let's setup the tasks service.

### 5.2 Tasks Service

The below example imports the `Task` class and connects it to the `tasks` service.

```ts
// src/store/store.tasks.ts
import { defineStore, pinia } from './store.pinia'
import { Task } from '../models/task'

export const useTaskStore = () => {
  const { $api } = useFeathers()
  const servicePath = 'tasks'
  const useStore = defineStore({
    servicePath,
    Model: Task,
    state() {
      return {}
    },
    getters: {},
    actions: {},
  })
  const store = useStore(pinia)

  $api.service(servicePath).hooks({})

  return {
    taskStore: store,
    Task: Task as typeof store.Model,
  }
}
```

Since we wrapped our stores in utility functions, we can use them with auto-import just like any utility in `composables`:

```vue
<script setup lang="ts">
const { User, userStore } = useUserStore()
const { Task, taskStore } = useTaskStore()
</script>
```

## 6. Authentication

If your app requires logins, the following sections demonstrate how to implement authentication.

<BlockQuote type="danger" label="Assess Your Risk">

The auth examples on this page will suffice for apps with simple security requirements. If you are building an app with privacy requirements, you need something more secure.

There are multiple ways to secure your app. If you need help, please [contact a FeathersHQ member](https://github.com/feathershq/) for consulting services.

</BlockQuote>

### 6.1 Auth Store

Feathers-Pinia 2.0 uses a `setup` store for the auth store. The new `useAuth` utility is a composition API utility which
contains all of the logic for authentication in most apps. Using the composition API this way allows more simplicity
while also allowing more flexibility for custom scenarios. We'll keep this example simple. To implement auth, create the
file below:

```ts
// store/store.auth.ts
import { defineStore, acceptHMRUpdate } from 'pinia'
import { useAuth } from 'feathers-pinia'

export const useAuthStore = defineStore('auth', () => {
  const { userStore } = useUserStore()
  const { $api } = useFeathers()

  const auth = useAuth({
    api: $api,
    userStore,
  })

  auth.reAuthenticate()

  return auth
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot))
}
```

Notice that we've called `useAuth` by providing the `api` and `userStore`. By providing the `userStore`, it will
automatically add a returned `user` to the store after succesful login. The above example also calls `reAuthenticate`,
which available starting with Feathers-Pinia 2.0, as well. The `reAuthenticate` utility will check for a valid, non-expiring
accessToken in the Feathers Client and automatically authenticate if one is found. It will fail silently to avoid the
need to catch errors during app initialization

### 6.2 `App.vue` Updates

With the auth store in place, we can now use it in our App.vue file to only show the UI once auth initialization has
completed. The auth store includes an `isInitDone` attribute to handle this scenario. It will become `true` either after
auth succeeds or fails. Assuming you've created a `Loading` component (not shown in this tutorial), you could show the
loading screen by using `v-if="authStore.isInitDone`, as shown here:

```vue
// src/App.vue
<script setup lang="ts">
const authStore = useAuthStore()
</script>

<template>
  <RouterView v-if="authStore.isInitDone" />
  <Loading v-else />
</template>
```

The final step is to protect our routes with Route Middleware, also known as navigation guards.

### 6.3 Route Middleware

We can now setup a route middleware to control the user's session. Creating the following file will allow
non-authenticated users to only view the routes listed in the `publicRoutes` array.  Authenticated users will have
access to all routes.  The following example assumes you've installed [vite-plugin-pages](https://www.npmjs.com/package/vite-plugin-pages)
and [vite-plugin-vue-layouts](https://github.com/JohnCampionJr/vite-plugin-vue-layouts), which allow using layouts and
file-based routing rules, similar to what Nuxt users are able to enjoy.

The route middleware starts with `router.beforeEach`.

```ts
// src/router.ts
import { createRouter, createWebHistory } from 'vue-router'
import { setupLayouts } from 'virtual:generated-layouts'
import generatedRoutes from '~pages'

const routes = setupLayouts(generatedRoutes)

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from) => {
  const authStore = useAuthStore()

  const publicRoutes = ['/', '/login']
  const is404 = to.matched[0].name === 'NotFound'
  if (publicRoutes.includes(to.path) || is404) {
    return true
  }

  // for non-public routes, check auth and apply login redirect
  await authStore.getPromise()
  if (!authStore.user) {
    authStore.loginRedirect = to
    return { path: '/login' }
  }
  return true
})
```

Another thing about the above middleware snippet is that, instead of blindly redirecting to the login page, it allows
the 404 page to work. It also uses a "login redirect", which means it checks if a non-logged in user tries to access a
page that requires authentication. It stores the `loginRedireect` so that after successful login the login page can
redirect the user to the page they were trying access in the first place.
