---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Getting Started with Vite

Learn how to setup Feathers-Pinia with Vite and Vue.js.

[[toc]]

## Installation

Install these packages using your preferred package manager:

```bash
# Core packages
pinia feathers-pinia

# For Socket.io (realtime) apps
@feathersjs/feathers @feathersjs/authentication-client @feathersjs/socketio-client socket.io-client

# For REST (no realtime) apps
@feathersjs/feathers @feathersjs/authentication-client @feathersjs/rest-client
```

You can also use the [install guide](./install) for more detailed installation instructions.

## Prerequisites

Follow these steps to get started with a new single-page Vite app:

1. [Create a Vue app with Vite](https://vitejs.dev/guide/#scaffolding-your-first-vite-project).
2. [Install packages](./install),
3. Follow the instructions, below

## Project Configuration

### TypeScript

By default, TypeScript will expect you to strictly identify properties on Model classes. See the `!` in the following example:

```ts
class UserModel extends BaseModel {
  foo!: string
  bar!: number
}
```

You can optionally configure TypeScript to not require the `!` on every property in your `tsconfig.json`. The `strictPropertyInitialization` property goes at the top level of the config, and not in the `compilerOptions`:

```json
{
  "strictPropertyInitialization": false,
  "compilerOptions": {
    // not in here
  }
}
```

With `strictPropertyInitialization` turned off, you can declare class properties as normal:

```ts
// No `!` needed after every property
class UserModel extends BaseModel {
  foo: string
  bar: number
}
```

## 1. Feathers Client

The first step is to setup a Feathers Client. Feathers-Pinia supports multiple, simultaneous Feathers API servers. The process is the same with one exception: the name of the client must be unique and becomes the alias for that particular API server.

The new [FeathersJS v5 Dove CLI](https://feathersjs.com/guides/cli/index.html) now creates [a fully-typed Feathers
Client](https://feathersjs.com/guides/cli/client.html) for you. The next examples use the new CLI-generated client that
comes with Dove apps.

<!--@include: ../partials/notification-feathers-client.md-->

::: code-group

```ts [createClient Socket.io]
// src/feathers.ts
import { createClient } from 'feathers-pinia-api'
import socketio from '@feathersjs/socketio-client'
import io from 'socket.io-client'

const host = import.meta.env.VITE_MY_API_URL as string || 'http://localhost:3030'
const socket = io(host, { transports: ['websocket'] })

const feathersClient = createClient(socketio(socket), { storage: window.localStorage })
```

```ts [createClient fetch]
// src/feathers.ts
import { createClient } from 'feathers-pinia-api'
import rest from '@feathersjs/rest-client'

const host = import.meta.env.VITE_MY_API_URL as string || 'http://localhost:3030'
const fetch = window.fetch.bind(window)

const feathersClient = createClient(rest(host).fetch(fetch), { storage: window.localStorage })
```

```ts [Socket.io]
// src/feathers.ts
import { type Service, feathers } from '@feathersjs/feathers'
import authenticationClient from '@feathersjs/authentication-client'
import socketio from '@feathersjs/socketio-client'
import io from 'socket.io-client'

// Define your custom types (usually imported from another file)
export interface Book {
  _id: string
  title: string
}

// Create a ServiceTypes generic
export interface ServiceTypes {
  'book': Service<Book>
}

const host = import.meta.env.VITE_MY_API_URL as string || 'http://localhost:3030'
const socket = io(host, { transports: ['websocket'] })

export const feathersClient = feathers<ServiceTypes>()
  .configure(socketio(socket))
  .configure(authenticationClient({ storage: window.localStorage }))
```

```ts [fetch]
// src/feathers.ts
import { type Service, feathers } from '@feathersjs/feathers'
import authenticationClient from '@feathersjs/authentication-client'
import rest from '@feathersjs/rest-client'

// Define your custom types (usually imported from another file)
export interface Book {
  _id: string
  title: string
}

// Create a ServiceTypes generic
export interface ServiceTypes {
  'book': Service<Book>
}

const host = import.meta.env.VITE_MY_API_URL as string || 'http://localhost:3030'
const fetch = window.fetch.bind(window)

export const feathersClient = feathers<ServiceTypes>()
  .configure(rest(host).fetch(fetch))
  .configure(authenticationClient({ storage: window.localStorage }))
```

:::

You can see an SSG-compatible localStorage example on the [Common Patterns](/guide/common-patterns#ssg-compatible-localstorage)
page.

### Multiple Feathers Clients

For additional Feathers APIs, export another Feathers client instance with a unique variable name. Here's an example that exports multiple **feathers-rest** clients:

```ts
// src/feathers.ts
import { feathers } from '@feathersjs/feathers'
import rest from '@feathersjs/rest-client'
import auth from '@feathersjs/authentication-client'

// The variable name of each client becomes the alias for its server.
export const feathersClient = feathers()
  .configure(rest('http://localhost:3030').fetch(fetch))
  .configure(auth())

export const analyticsClient = feathers()
  .configure(rest('http://localhost:3031').fetch(fetch))
  .configure(auth())
```

### Create Pinia Client

Now add this code to the bottom of the same file:

```ts
// src/feathers.ts
export const api = createPiniaClient(feathersClient, {
  pinia,
  idField: '_id',
  // optional
  ssr: false,
  whitelist: [],
  paramsForServer: [],
  skipGetIfExists: true,
  customSiftOperators: {},
  setupInstance(data) {
    return data
  },
  customizeStore(defaultStore) {
    return {}
  },
  services: {},
})
```

See a full explanation of options on the [createPiniaClient](/guide/create-pinia-client) page.

The above code wraps the `feathersClient` into a Feathers-Pinia turbocharged client. To create or reference a store, you
just use the service like you would with a plain Feathers Client:

```ts
// Creates a 'users' service store and fetches data
api.service('users').get(1)
```

Next we need to setup Pinia.

## 2. Pinia

Create the file `src/modules/pinia.ts` and paste in the following code, which creates a `pinia` instance:

```ts
// src/modules/pinia.ts
import { createPinia } from 'pinia'

export const pinia = createPinia()
```

Now in `src/main.ts`, import the `pinia` instance we just created and pass it to `app.use(pinia)`. Here's an example
from this example app [feathers-pinia-vite](https://github.com/marshallswain/feathers-pinia-vite):

```ts{6,11}
// src/main.ts
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { router } from './router'
import { pinia } from './modules/pinia'
import { createHead } from '@vueuse/head'

const head = createHead()

createApp(App).use(pinia).use(router).use(head).mount('#app')
```

## 3. `useFeathers` and Auto-Imports

To make Feathers Client easily accessible, we'll create a composable called `useFeathers`.

```ts
// src/composables/feathers.ts
import { api } from '../feathers'

// Provides access to Feathers Client(s)
export function useFeathers() {
  return { api }
}
```

Next, [setup Auto-Imports for Vite](/guide/auto-imports). Auto-imports allow us to use functions without importing them.
We can retrieve the `api` in one line of code, now:

```ts
const { api } = useFeathers()
```

## 4. Service Stores

With `createPiniaClient`, service stores are created automatically when you access a service. Here's how to use them:

```ts
// Access a service - this automatically creates a store if it doesn't exist
const usersService = api.service('users')

// Use the service like any Feathers service
const user = await usersService.get(1)

// The service also has store methods
const users = usersService.findInStore({ query: { active: true } })
```

For more advanced scenarios, you can create custom service configurations:

```ts
// src/feathers.ts
export const api = createPiniaClient(feathersClient, {
  pinia,
  idField: '_id',
  services: {
    users: {
      idField: 'id', // Override global setting for this service
      setupInstance(data, { app, service, servicePath }) {
        // Custom instance setup for users service
        return data
      },
    },
  },
})
```

The `setupInstance` function is powerful for data modeling, relationships, and custom instance behavior. Learn more about advanced data modeling techniques in the [Data Modeling guide](/guide/data-modeling).


### Using Stores in Components

Now you can use the services in your Vue components:

```vue
<template>
  <div>
    <h1>Users</h1>
    <ul>
      <li v-for="user in users" :key="user.id">
        {{ user.name }}
      </li>
    </ul>
  </div>
</template>

<script setup>
const { api } = useFeathers()

// Get the users service
const usersService = api.service('users')

// Fetch users
const { data: users } = await usersService.useFind({ query: {} })
</script>
```

## 5. Authentication

If your app requires user login, the following sections demonstrate how to implement it.

<!--@include: ../partials/assess-your-auth-risk.md-->

### 5.1 Auth Store

Feathers-Pinia 3.0 uses a `setup` store for the auth store. The new `useAuth` utility contains all of the logic for
authentication in most apps. Using the composition API allows more simplicity and more flexibility for custom scenarios.
We'll keep this example simple. To implement auth, create the file below:

<!--@include: ../partials/notification-access-token.md-->

```ts
// stores/auth.ts
import { acceptHMRUpdate, defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const { api } = useFeathers()
  const auth = useAuth({ api, servicePath: 'users' })
  auth.reAuthenticate()
  return auth
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot))
```

Notice that we've called `useAuth` with the `api` and `userStore`. Providing the `userStore`automatically adds the
`user` to the store after successful login. The above example also calls `reAuthenticate`, which checks for a valid,
non-expired accessToken in the Feathers Client and automatically authenticates if one is found. It will fail silently
to avoid the need to catch errors during app initialization.

### 5.2 `App.vue` Updates

With the auth store in place, we can now use it in our App.vue file to only show the UI once auth initialization has
completed. The auth store includes an `isInitDone` attribute to handle this scenario. It will become `true` after auth
either succeeds or fails. Assuming you've created a `Loading` component (not shown), you could show the
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

Now a loading screen will show until auth is ready.

### 5.3 Route Middleware

The final step is to protect our routes with Route Middleware, also known as navigation guards.

Let's create a route middleware to control the user's session. The following file limits non-authenticated users to see
the routes listed in the `publicRoutes` array. Authenticated users will have access to all routes. The example assumes
you've installed [vite-plugin-pages](https://www.npmjs.com/package/vite-plugin-pages) and
[vite-plugin-vue-layouts](https://github.com/JohnCampionJr/vite-plugin-vue-layouts), which enable layouts and
file-based routing rules similar to how Nuxt works.

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
  if (publicRoutes.includes(to.path) || is404)
    return true

  // for non-public routes, check auth and apply login redirect
  await authStore.getPromise()
  if (!authStore.user) {
    authStore.loginRedirect = to
    return { path: '/login' }
  }
  return true
})
```

Instead of blindly redirecting to the login page, the above code allows the 404 page to work. It also uses a
"login redirect", which means it checks if a non-logged in user tries to access a page that requires authentication.
It stores the `loginRedireect` so that after successful login the login page can redirect the user to the page they were
trying access in the first place.

## What's Next?

Learn how to query data with a [Feathers-Pinia service](/services/).
