---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Starting a Vite Project

[[toc]]

For the TLDR (Too Long, Didn't Read) version, you can take a look at the [feathers-pinia-vite repo](https://github.com/marshallswain/feathers-pinia-vite).

## Overview

Follow these steps to get started with a new single-page Vite app:

1. [Create a Vue app with Vite](https://vitejs.dev/guide/#scaffolding-your-first-vite-project).
2. [Install Modules](./install),
3. Follow the instructions, below

## 1. Feathers Client

The first step is to setup a Feathers Client.

The new [FeathersJS v5 Dove CLI](https://feathersjs.com/guides/cli/index.html) now creates [a fully-typed Feathers
Client](https://feathersjs.com/guides/cli/client.html) for you. The next examples shows what it looks like to use the
new client.

<!--@include: ./notification-feathers-client.md-->

::: code-group

```ts [with Socket.io]
import { createClient } from 'feathers-pinia-api'
import socketio from '@feathersjs/socketio-client'
import io from 'socket.io-client'

const host = import.meta.env.VITE_MYAPP_API_URL as string || 'http://localhost:3030'
const socket = io(host, { transports: ['websocket'] })

export const api = createClient(socketio(socket), { storage: window.localStorage })
```

```ts [with fetch]
import { createClient } from 'feathers-pinia-api'
import rest from '@feathersjs/rest-client'

const host = import.meta.env.VITE_MYAPP_API_URL as string || 'http://localhost:3030'
window.fetch.bind(window)

export const api = createClient(rest(host).fetch(fetch), { storage: window.localStorage })
```

:::

You can find an SSG-compatible version of the above code on the [Common Patterns](/guide/common-patterns#ssg-compatible-localstorage)
page.

<BlockQuote>
If upgrading from Feathers v4 Crow and you receive an error like this one:

```txt
"Error: Failed to execute 'fetch' on 'Window': Illegal invocation"
```

You can fix this by binding `window` to `fetch`

```ts
window.fetch.bind(window)
```

</BlockQuote>

## 2. Install Pinia

Create the file `src/modules/pinia.ts` and paste in the following code, which creates a `pinia` instance:

```ts
// src/modules/pinia.ts
import { createPinia } from 'pinia'

export const pinia = createPinia()
```

Now in `src/main.ts`, import the `pinia` instance we just created and pass it to `app.use(pinia)`. Here's an example
from the example app [feathers-pinia-vite](https://github.com/marshallswain/feathers-pinia-vite):

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

Let's setup an easy way to access the Feathers Client. We'll create a composable called `useFeathers`. We'll use it to
retrieve the Feathers Client throughout the app. Create the following file:

```ts
// composables/feathers.ts
import { api } from '../feathers'

// Provides access to Feathers Client(s)
export const useFeathers = () => {
  return { api }
}
```

Next, [setup Auto-Imports for Vite](/guide/auto-imports). Auto-imports allow us to use functions without importing them.
We can retrieve the `api` in one line of code, now:

```ts
const { api } = useFeathers()
```

Setting up [Auto-Imports](/guide/auto-imports) as instructed also allows the `models` and `stores` folders to work
automatically with Feathers-Pinia, so your app will be ready to create Models.

## 4. Model Functions

With [Auto-Imports](/guide/auto-imports) in place, you're ready to begin [Data Modeling](/guide/modeling-overview).
Feathers-Pinia can directly use TypeScript types from a FeathersJS v5 Dove backend, or you can provide your own types.
Let's create two [Model Functions](/guide/model-functions): `User` and `Task`.

### 4.1. User Model

Here's the `User` Model. Notice that since Feathers-Pinia v2 is highly modular, using [Auto-Imports](/guide/auto-imports)
really cleans things up.

<!--@include: ./notification-feathers-client.md-->

<!--@include: ./example-user-model.md-->

This code does more than setup the Model. It also

- assures the Model is only created once per request, even if you call `useUserModel` multiple times.
- allows the Model and store to be kept in different folders, keeping Models in `models` and stores in `stores`.
- assures the Model and store are properly connected.
- assures hooks are only registered once.

<BlockQuote type="warning" label="Model.store vs store">

Models have a `store` property that references the pinia store. (We will setup the pinia stores in the next steps) The
current types won't pick up on customizations. This means that for customized stores, you'll need to access them with
their own `useUserStore` or equivalent function.

In this tutorial, `User.store` and `useUserStore()` both hold the same value, but TypeScript doesn't know it, yet.

This limitation will be fixed in a future release.

</BlockQuote>

### 4.2. Task Model

Now let's create the `Task` Model:

<!--@include: ./example-task-model.md-->

## 5. Service Stores

<!--@include: ../partials/setting-up-service-stores.md-->

## 6. Authentication

If your app requires user login, the following sections demonstrate how to implement it.

<!--@include: ../partials/assess-your-auth-risk.md-->

### 6.1 Auth Store

Feathers-Pinia 2.0 uses a `setup` store for the auth store. The new `useAuth` utility contains all of the logic for
authentication in most apps. Using the composition API allows more simplicity and more flexibility for custom scenarios.
We'll keep this example simple. To implement auth, create the file below:

<!--@include: ./notification-access-token.md-->

```ts
// stores/auth.ts
import { defineStore, acceptHMRUpdate } from 'pinia'

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
automatically add a returned `user` to the store after successful login. The above example also calls `reAuthenticate`,
which checks for a valid, non-expired accessToken in the Feathers Client and automatically authenticates if one is
found. It will fail silently to avoid the need to catch errors during app initialization.

### 6.2 `App.vue` Updates

With the auth store in place, we can now use it in our App.vue file to only show the UI once auth initialization has
completed. The auth store includes an `isInitDone` attribute to handle this scenario. It will become `true` after auth
either succeeds or fails. Assuming you've created a `Loading` component (not shown in this tutorial), you could show the
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

### 6.3 Route Middleware

The final step is to protect our routes with Route Middleware, also known as navigation guards.

Let's create a route middleware to control the user's session. The following file limits non-authenticated users to see
the routes listed in the `publicRoutes` array. Authenticated users will have access to all routes. The example assumes
you've installed [vite-plugin-pages](https://www.npmjs.com/package/vite-plugin-pages) and
[vite-plugin-vue-layouts](https://github.com/JohnCampionJr/vite-plugin-vue-layouts), which allow using layouts and
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

## What's Next?

Check out the full example app: [feathers-pinia-vite](https://www.github.com/marshallswain/feathers-pinia-vite). Check
out the login component to see an example of signup/login.
