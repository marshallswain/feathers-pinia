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
2. [Install Feathers-Pinia](./setup),
3. Follow the instructions, below.

<BlockQuote>

Note that for auto-import to work in Nuxt 3, the dev server must be running. The dev server builds the TypeScript types for you as you code, which is really convenient.

</BlockQuote>

## 1. Install `ofetch`

The `ofetch` adapter fulfills the promise of the `fetch` API, being a universal client that works on client, server, and in serverless environments.  Install it with the following command.  Note that you can put it in `devDependencies` since Nuxt makes a clean, standalone version of your project during build.

```bash
npm i ofetch -D
```

## 2. Feathers Client Plugin

With `ofetch` installed, you can use the `OFetch` adapter from Feathers-Pinia to setup a Feathers client. The following example shows how to setup a hybrid client that uses `fetch` on the server and seamlessly switches to WebSockets on the client.  Yes! Feathers-Pinia is capable of switching client transports and will continue to work seamlessly!

Notice that we prefix the filename with `1.`, this is to guarantee that Nuxt runs our future plugins in the correct order. In the future, if you need to run other plugins before the `feathers.plugin.ts` file, you can update the numbers to reflect the required order.

```ts
// plugins/1.feathers.ts
import { $fetch } from 'ofetch'
import rest from '@feathersjs/rest-client'
import socketio from '@feathersjs/socketio-client'
import io from 'socket.io-client'
import { feathers } from '@feathersjs/feathers'
import { OFetch, setupFeathersPinia } from 'feathers-pinia'

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
    api.configure(rest(host).fetch($fetch, OFetch))

  // Switch to Socket.io on the client
  else
    api.configure(socketio(io(host, { transports: ['websocket'] })))

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

The above example pulls the `$api` object from `useNuxtApp` and returns it inside another object. For multiple clients, you can repeat the previous two steps with a different name than `api`. With the above composable in place, we can now access the Feathers client in components, plugins, and middleware:

```ts
const { $api } = useFeathers()
```

With Feathers-Pinia, you rarely need the bare Feathers client, but when you do need it, it's only one line of code away. It's definitely convenient.

## 4. Model Classes

In Nuxt 3, we keep Model classes in their own directory, separate from the service store setup. For this example setup we will show two Models: a `User` class and a `Task` class. Each one shows a different example of setting up a relationship with the other by using `associateFind` and `associateGet`.

### 4.1. User Class Example

Here's the `User` Model with the `associateFind` utility:

```ts
// models/user.ts
import type { AssociateFindUtils } from 'feathers-pinia'
import { BaseModel, associateFind } from 'feathers-pinia'
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
  static setupInstance(user: Partial<User>) {
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

It's important that you do not reference the service stores inside of Model classes `setupInstance`. In the above example, the line `import { Task } from './task.ts'` pulls in a related model.

</BlockQuote>

### 4.2. Task Class Example

Now here's the `Task` Model with the `associateGet` utility:

```ts
// models/task.ts
import type { Id } from '@feathersjs/feathers'
import { BaseModel, associateGet } from 'feathers-pinia'
import { User } from './user'

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
  static setupInstance(task: Partial<Task>) {
    associateGet(task as any, 'user', {
      Model: User,
      getId: () => task.userId as Id,
    })
  }
}
```

Note that the `Task` Model, above, references associated classes inside `setupInstance` in the same way that the `User` class did, and it's really nice that the underlying tooling allows circular imports, now.  With the two Model classes in place, we're ready to setup the service stores.

For more information about setting up associations, see the [Model Associations](./model-associations) page.

## 5. Service Stores

In Nuxt 3, the user stores are setup as auto-imported composables, making them really convenient to use.  (If you haven't noticed, yet, one of the primary themes of Nuxt 3 is convenient Developer Experience.)

### 5.1 Users Service

To setup the `/users` service store, create the following file:

```ts
// composables/service.users.ts
import { User } from '~/models/user'

export const useUserStore = () => {
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

Note that we have to cast the `User` model into `typeof userStore.Model`. For now, casting is required.

</BlockQuote>

### 5.2 Tasks Service

To setup the `/tasks` service store, create the following file:

```ts
// composables/service.tasks.ts
import { Task } from '~~/models/task'

export const useTaskStore = () => {
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

With the above files in place, we're ready to start using stores in components!

### 5.3. Using Stores

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

## 6. Authentication

If your app requires login, the following sections demonstrate how to cleanly support it. In an ideal world, we add auth without mixing concerns.  Let's take a look at how we can add auth without touching our existing code.

<BlockQuote type="danger" label="Assess Your Risk">

These auth example on this page will suffice for apps with simple security requirements. If you are building an app with privacy requirements, you need something more secure.

There are multiple ways to secure your app. If you need help, please [contact a FeathersHQ member](https://github.com/feathershq/) for consulting services.

</BlockQuote>

### 6.1 Auth Store

Create the following file, then let's review what it does.

```ts
// composables/auth.ts
import { defineStore } from 'pinia'
import decode from 'jwt-decode'

interface AuthenticateOptions {
  strategy: 'jwt' | 'local'
  accessToken?: string
  email?: string
  password?: string
}

export const useAuthStore = defineStore('auth', () => {
  const { $api } = useFeathers()
  const { userStore } = useUserStore()
  const userId = ref(null)
  const user = computed(() => userStore.getFromStore(userId))

  const storageKey = 'feathers-jwt'
  const jwt = useCookie<string | null>(storageKey)
  const storage = {
    getItem: () => jwt.value,
    setItem: (val: string) => jwt.value = val,
    removeItem: () => jwt.value = null,
  }

  const validateJwt = (jwt: string) => {
    try {
      const payload = decode(jwt) as any
      const isExpired = new Date().getTime() > payload.exp * 1000
      if (isExpired) {
        storage.removeItem()
        return false
      }
      return true
    }
    catch (error) {
      return false
    }
  }
  const authenticate = (options?: AuthenticateOptions) => $api.authenticate(options)
    .then((result: any) => {
      const { accessToken, user } = result
      jwt.value = accessToken
      userStore.addToStore(user)
      userId.value = user._id
      return result
    })
  const logout = () => {
    $api.logout()
    storage.removeItem()
    window.location.reload()
  }

  return {
    user,
    storage,
    storageKey,
    jwt,
    validateJwt,
    authenticate,
    logout,
  }
})
```

The above file includes the following logic:

- User setup
  - Create a `userId` property.
  - Create a computed `user` property which uses `userId` to get the associated user from the `userStore`. This keeps the user up to date as updates happen.
- Cookie + JWT
  - Integrate Nuxt 3's new `useCookie` utility into the `@feathersjs/authentication-client` plugin.
  - Specify the name of the cookie, which can be changed if desired.
- JWT expiration checking.
- An `authenticate` function which stores the `user` and sets the `userId`.
- A `logout` function, which removes the JWT from storage and refreshes the page. When we create our auth middleware, the refresh will trigger a route change to redirect the user. If you use Feathers-Pinia's [localStorage plugin](/guide/storage-sync), you might clear localStorage before refreshing the page.

### 6.2 Auth Plugin

Now let's move on to create the `auth` plugin, which will use the logic in the `useAuthStore` composable we just created. We'll prefix it with `2.` to make sure it runs after the Feathers Client has been configured.

```ts
// plugins/2.feathers-auth.ts
import auth from '@feathersjs/authentication-client'

export default defineNuxtPlugin(async (_nuxtApp) => {
  const { $api } = useFeathers()
  const authStore = useAuthStore()
  const { storage, storageKey, jwt } = authStore

  $api.configure(auth({ storage, storageKey }))

  if (jwt && authStore.validateJwt(jwt)) {
    // authenticate with valid jwt
    await authStore.authenticate({ strategy: 'jwt', accessToken: jwt })
  }

  return {}
})
```

The above `feathers-auth.ts` plugin performs the following:

- Pulls in the `$api` client. Since plugins run in order, we can reference the `$api` that was `provided` in the `1.feathers.ts` plugin. This allows us to configure the `@feathersjs/authentication-client` on the Feathers client instance. Since we returned `{ provide: { api } }` in the first plugin, it gets prefixed inside the `nuxtApp` object, which is the same object returned by `useNuxtApp`.
- Pulls in the auth store's logic created in the previous step and uses it to configure the feathers auth plugin.
- Checks the existince of the jwt. Validates it, if it exists, then uses it as an `accessToken` to authenticate with the API.
- If no `jwt` is present, the user is not authenticatee, so now we can use `middleware` to control the flow of our users' login process.

### 6.3 Route Middleware

With the auth store and plugin in place, we can now setup a route middleware to control the user's session. Creating the following file will allow non-authenticated users to only view the routes listed in the `publicRoutes` array.  Authenticated users will have access to all routes.

```ts
// middleware/session.global.ts
export default defineNuxtRouteMiddleware(async (to, _from) => {
  const auth = useAuthStore()

  // Allow 404 page to show
  const router = useRouter()
  const allRoutes = router.getRoutes()
  if (!allRoutes.map(r => r.path).includes(to.path))
    return

  // if user is not logged in, redirect to '/' when not navigating to a public page.
  const publicRoutes = ['/', '/login']
  if (!auth.user?.value) {
    if (!publicRoutes.includes(to.path))
      return navigateTo('/')
  }
})
```

One more thing about the above middleware snippet is that, instead of blindly redirecting to the login page, it allows the 404 page to work by bringing in the list of `allRoutes` and checking the current route against the list.
