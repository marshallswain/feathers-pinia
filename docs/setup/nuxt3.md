---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Nuxt 3

[[toc]]

For the TLDR (Too Long, Didn't Read) version, you can take a look at the [feathers-pinia-nuxt3 repo](https://github.com/marshallswain/feathers-pinia-nuxt3).
For now, the app currently only provides a demo of authentication. More features will be demonstrated at a future time.

## Overview

Follow these steps to get started with a new Nuxt app:

1. Create a Nuxt app
   - [Use the starter project](https://github.com/marshallswain/feathers-pinia-nuxt3) and read the below as reference. OR
   - [Start a new Nuxt app](https://v3.nuxtjs.org/getting-started/installation) and follow the below as instructions.
2. [Install packages](./install),
3. Follow the instructions, below.

<BlockQuote>

Note that for auto-import to work in Nuxt 3, the dev server must be running. The dev server builds the TypeScript types for you as you code, which is really convenient.

</BlockQuote>

## 1. Feathers Client

In Nuxt, we setup the Feathers Client in a Nuxt plugin. This way, every request has its own client instance, preventing
the ability to leak data between requests.

Nuxt supports Static Site Generation (SSG), Server-Side Rendering (SSR), and Hybrid Rendering (mixed rendering types).
We'll setup a Feathers Client that will work in any mode. This example will use `@feathersjs/rest` with `fetch` on the
server and `@feathersjs/socketio` in the browser.

Since we need an SSR-compatible version of `fetch`, we will use [ofetch](/guide/ofetch).

```bash
npm i ofetch -D
```

Next, create a file named `1.feathers.ts` in the `plugins` folder. We prefix with a `1` because Nuxt plugins are run in
alphabetical order. We want Feathers to load before other plugins that might use it. An example is provided for the
typed Dove client and for a manually-setup client.

<!--@include: ../partials/nuxt-feathers-client-example.md-->

The previous code snippet utilizes Nuxt's `useCookie` for SSR compatibility. If you plan to use SSG or a
non-server-based rendering strategy, see [SSG-Compatible localStorage](/guide/common-patterns#ssg-compatible-localstorage)
on the Common Patterns page.

Also, notice the line at the end: `return { provide: { api } }`. This line makes the `api` available to the rest of the
Nuxt application. We'll use it after we setup Pinia.

## 2. Pinia

Let's get Pinia installed and update the Nuxt config:

```bash
npm install pinia @pinia/nuxt
```

Setup your Nuxt config:

<!--@include: ../partials/nuxt-config.md-->

## 3. `useFeathers` Composable

Let's create a composable that gives us universal access to our Feathers-Pinia Client:

```ts
// composables/feathers.ts

// Provides access to Feathers clients
export const useFeathers = () => {
  const { $api: api } = useNuxtApp()
  return { api }
}
```

Any key returned in a Nuxt plugin's `provide` object will have a `$` prepended. The above example normalizes it back
to `api`. You can return multiple clients in this object, if desired. With the above composable in place, we can now
access the Feathers client from within in components, plugins, and middleware, like this:

```ts
const { api } = useFeathers()
```

Auto-imports decouple our code from module paths and are super convenient. Read more about
[Auto-Imports in the Nuxt Module](/guide/nuxt-module).

You're ready to start managing data with Feathers Pinia. There's no need to setup Models or Stores, since it's all done
for you, implicitly. If your applications needs user login, continue to the next section.

## 4. Authentication

The following sections demonstrate how to implement local authentication.

<!--@include: ../partials/assess-your-auth-risk.md-->

### 4.1 Auth Store

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
  return auth
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot))

```

Notice that we've called `useAuth` by providing the `api` and `servicePath` to the users service. By providing the
`servicePath`, it will automatically add a returned `user` to the store after successful login.

The Auth store for Nuxt varies slightly from the Vite app. It does not call `reAuthenticate` inside the store. Instead,
we will call it in the next step from within the auth plugin.

### 4.2 Auth Plugin

Now let's create a plugin to automatically `reAuthenticate` after a refresh. We'll call it `2.feathers-auth.ts`
in order to make sure it runs after the Feathers-Pinia Client is ready.

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

### 4.3 Route Middleware

Now let's protect some routes.  Create the following file to restrict non-authenticated users the routes in the
`publicRoutes` array. Authenticated users will have access to all routes.

```ts
// middleware/session.global.ts
export default defineNuxtRouteMiddleware(async (to, _from) => {
  const auth = useAuthStore()

  await auth.getPromise()

  // Allow 404 page to show
  if (!to.matched.length)
    return

  // if user is not logged in, redirect to '/' when not navigating to a public page.
  const publicRoutes = ['/', '/login']
  if (!auth.user) {
    if (!publicRoutes.includes(to.path))
      return navigateTo('/')
  }
})

```

Instead of blindly redirecting to the login page, the middleware allows the 404 page to work by checking the current
route for matches.

## What's Next?

Learn how to query data with a [Feathers-Pinia service](/services/).
