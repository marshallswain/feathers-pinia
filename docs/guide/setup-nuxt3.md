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

# Nuxt 3

[[toc]]

For the TLDR (Too Long, Didn't Read) version, you can take a look at the [feathers-pinia-nuxt3 repo](https://github.com/marshallswain/feathers-pinia-nuxt3).
For now, the app currently only provides a demo of authentication. More features will be demonstrated at a future time.

## Overview

Follow these steps to get started with a new Nuxt app:

1. Create a Nuxt app
   - [Use the starter project](https://github.com/marshallswain/feathers-pinia-nuxt3) and read the below as reference. OR
   - [Start a new Nuxt app](https://v3.nuxtjs.org/getting-started/installation) and follow the below as instructions.
2. [Install Feathers-Pinia](./setup),
3. Follow the instructions, below.

<BlockQuote>

Note that for auto-import to work in Nuxt 3, the dev server must be running. The dev server builds the TypeScript types for you as you code, which is really convenient.

</BlockQuote>

## 1. Feathers Client

In Nuxt, we setup the Feathers Client in a Nuxt plugin. This way, every request has its own client instance, preventing
the ability to leak data between requests.

Nuxt supports Static Site Generation (SSG), Server-Side Rendering (SSR), and Hybrid Rendering (mixed rendering types).
The primary difference between setting them up involves the Feathers Client. This example will use `@feathersjs/rest`
with `fetch` on the server and `@feathersjs/socketio` in the browser.

Since we need an SSR-compatible version of `fetch`, we will use [ofetch](/guide/ofetch).

```bash
npm i ofetch -D
```

Next, create a file named `1.feathers.ts` in the `plugins` folder. We prefix with a `1` because Nuxt plugins are run in
alphabetical order. We want Feathers to load before other plugins that might use it.

<!--@include: ./nuxt-feathers-client-example.md-->

The previous code snippet utilizes Nuxt's `useCookie` for SSR compatibility. If you plan to use SSG or a
non-server-based rendering strategy, see [SSG-Compatible localStorage](/guide/common-patterns#ssg-compatible-localstorage)
on the Common Patterns page.

Also, notice the line at the end: `return { provide: { api } }`. This line makes the `api` available to the rest of the
Nuxt application. We'll use it after we setup Pinia.

## 2. Install Pinia

Let's get Pinia installed and update the Nuxt config:

```bash
npm install pinia @pinia/nuxt
```

Setup your Nuxt config:

```ts
// nuxt.config.ts
// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
    'nuxt-feathers-pinia',
  ],
  // Allows you to put stores and models in their own folders
  imports: {
    dirs: [
      'stores',
      'models',
    ],
  },
  // Enable Nuxt Takeover Mode
  typescript: {
    shim: false,
  },
  // optional, Vue Reactivity Transform
  experimental: {
    reactivityTransform: true,
  },
})
```

You can read more about the above configuration at these links:

- [@pinia/nuxt module](https://pinia.vuejs.org/ssr/nuxt.html)
- [nuxt-feathers-pinia module](/guide/nuxt-module)
- [Nuxt `imports` config](https://nuxt.com/docs/api/configuration/nuxt-config#imports)
- [Nuxt Takeover Mode](https://nuxt.com/docs/getting-started/installation#prerequisites)
- [Vue Reactivity Transform](https://vuejs.org/guide/extras/reactivity-transform.html)

Using the extra `imports` as shown above enables Nuxt's auto-import feature in the `models` and `stores` folders, which
will come in handy for Model and store creation, later.

Finally, if npm is your package manager and you see the error `ERESOLVE unable to resolve dependency tree`, add this to
your package.json:

```json
"overrides": { 
  "vue": "latest"
}
```

## 3. `useFeathers` Composable

Let's create a composable that gives us instant access to the Feathers Client.

```ts
// composables/feathers.ts

// Provides access to Feathers clients
export const useFeathers = () => {
  const { $api: api } = useNuxtApp()
  return { api }
}
```

Any key returned in a Nuxt plugin's `provide` object will have a `$` prepended. The `useFeathers` composables pulls the
`$api` object from `useNuxtApp`, renames it to `api` and returns it in another object. You could return multiple clients
in this same object. With the above composable in place, we can now access the Feathers client from within in
components, plugins, and middleware:

```ts
const { api } = useFeathers()
```

Auto-imports decouple our code from module paths and are super convenient. Read more about
[Auto-Imports in the Nuxt Module](/guide/nuxt-module).

## 4. Model Classes

You're ready to begin [Data Modeling](/guide/modeling-overview). Feathers-Pinia can directly use TypeScript types from a
FeathersJS v5 Dove backend, or you can provide your own types. Let's create two
[Model Functions](/guide/model-functions): `User` and `Task`.

### 4.1. User Model

Here's the `User` Model. Notice that since Feathers-Pinia v2 is highly modular, using [Auto-Imports](/guide/auto-imports)
really cleans things up.

<!--@include: ./notification-feathers-client.md-->

<!--@include: ./example-user-model.md-->

### 4.2. Task Model

Now let's create the `Task` Model:

<!--@include: ./example-task-model.md-->

## 5. Service Stores

In Nuxt 3, the user stores are setup as auto-imported composables, making them really convenient to use.  (If you haven't noticed, yet, one of the primary themes of Nuxt 3 is convenient Developer Experience.)

### 5.1 Users Service

To setup the `/users` service store, create the following file:

```ts
// composables/service.users.ts
import { defineStore } from 'pinia'
import { useService } from 'feathers-pinia'

export const useUserStore = () => {
  const { pinia, idField, whitelist, servicePath, service, name } = useUsersConfig()

  const useStore = defineStore(servicePath, () => {
    const utils = useService({ service, idField, whitelist })
    return { ...utils }
  })
  const store = useStore(pinia)

  connectModel(name, useUserModel, () => store)

  return store
}
```

With the above file in place, you can call `const userStore = useUserStore()` from any component to get the userStore.

### 5.2 Tasks Service

To setup the `/tasks` service store, create the following file:

```ts
// composables/service.tasks.ts
import { defineStore } from 'pinia'
import { useService } from 'feathers-pinia'

export const useTaskStore = () => {
  const { pinia, idField, whitelist, servicePath, service, name } = useTasksConfig()

  const useStore = defineStore(servicePath, () => {
    const utils = useService({ service, idField, whitelist })
    return { ...utils }
  })
  const store = useStore(pinia)

  connectModel(name, useTaskModel, () => store)

  return store
}
```

Now we can use the `taskStore` by calling `const taskStore = useTaskStore()`.

## 6. Authentication

If your app requires user login, the following sections demonstrate how to implement it.

<!--@include: ./assess-your-auth-risk.md-->

### 6.1 Auth Store

Feathers-Pinia 2.0 uses a `setup` store for the auth store. The new `useAuth` utility contains all of the logic for
authentication in most apps. Using the composition API allows more simplicity and more flexibility for custom scenarios.
We'll keep this example simple. To implement auth, create the file below:

<!--@include: ./notification-access-token.md-->

```ts
// stores/auth.ts
import { acceptHMRUpdate, defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const { userStore } = useUserStore()
  const { api } = useFeathers()

  const auth = useAuth({ api, userStore })

  return auth
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot))

```

Notice that we've called `useAuth` by providing the `api` and `userStore`. By providing the `userStore`, it will
automatically add a returned `user` to the store after successful login. The above example also calls `reAuthenticate`,
which checks for a valid, non-expired accessToken in the Feathers Client and automatically authenticates if one is
found. It will fail silently to avoid the need to catch errors during app initialization.

The Auth store for Nuxt is different than the one in the Vite app. It does not call `reAuthenticate` inside the store.
Instead, we will call it in the next step from within the auth plugin.

### 6.2 Auth Plugin

Now let's move on to create the `feathers-auth` plugin, which will use auth store. We'll prefix the filename with `2.`
in order to make sure it runs after the Feathers Client is created.

```ts
// plugins/2.feathers-auth.ts
/**
 * Make sure reAuthenticate finishes before we begin rendering.
 */
export default defineNuxtPlugin(async (_nuxtApp) => {
  const auth = useAuthStore()
  await auth.reAuthenticate()
})

```

### 6.3 Route Middleware

With the auth store and plugin in place, we can now setup a route middleware to control the user's session. Create the
following file to restrict non-authenticated users the routes in the `publicRoutes` array. Authenticated users will have
access to all routes.

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

Instead of blindly redirecting to the login page, the middleware allows the 404 page to work by bringing in the list of
`allRoutes` and checking the current route against the list.

## What's Next?

Check out the full example app: [feathers-pinia-nuxt3](https://www.github.com/marshallswain/feathers-pinia-nuxt3). Check
out the login component to see an example of signup/login.
