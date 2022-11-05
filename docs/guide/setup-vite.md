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
import feathers from '@feathersjs/feathers'
import socketio from '@feathersjs/socketio-client'
import auth from '@feathersjs/authentication-client'
import io from 'socket.io-client'
import { iff, discard } from 'feathers-hooks-common'

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
If upgrading from v4 (crow) and you receive this error "Error: Failed to execute 'fetch' on 'Window': Illegal invocation", make sure you bind the window to the fetch `window.fetch.bind(window)`
:::

## 2. Pinia

These few lines of code to setup pinia go in `/store/store.pinia.ts`. The `setupFeathersPinia` utility wraps `defineStore` and provides a global configuration (as long as you use the returned `defineStore`). It's not recommended to use a global configuration, like the below example, in SSR scenarios.

:::tip
Adding `.pinia.` to each store's filename will help disambiguate utilities from store setup. If you're upgrading a Vuex app, it helps distinguish which Vuex services haven't been upgraded, yet.
:::

```ts
// store/store.pinia.ts
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

The final step to setup `pinia` is to add `pinia` as an app plugin, like this:

```ts
// src/main.ts
import { createApp, App as AppType } from 'vue-demi'
import { router } from './routes'
import { pinia } from './store/store.pinia' // import from the file you just created.
import App from './App.vue'

const app = createApp(App)
  .use(pinia) // register pinia as a plugin. This also enables devtools support
  .use(router)
  .mount('#app')
```

## 3. Service Stores

Now that we've created the main `pinia` store, we are ready to setup our first service. Here's an example that creates a User class and connects it to the `users` service. This next example uses the global configuration, so it won't work well for SSR:

```ts
// src/store/users.ts
import { defineStore, BaseModel } from './store.pinia'
import { api } from '../feathers'

// create a data model
export class User extends BaseModel {
  id?: number | string
  name: string = ''
  email: string = ''
  password: string = ''

  // Minimum required constructor
  constructor(data: Partial<User> = {}, options: Record<string, any> = {}) {
    super(data, options)
    this.init(data)
  }

  // optional for setting up data objects and/or associations
  static setupInstance(message: Partial<Message>) {
    const { store, models } = this
  }
}

const servicePath = 'users'
export const useUsers = defineStore({ servicePath, Model: User })

api.service(servicePath).hooks({})
```

Small tweaks are needed for SSR apps:

1. Import `defineStore` directly from `feathers-pinia`.
2. Pass all options to `defineStore`

```js
import { defineStore, BaseModel } from 'feathers-pinia' // (1)
import { api } from '../feathers'

// create a data model
export class User extends BaseModel {
  id?: number | string
  name: string = ''
  email: string = ''
  password: string = ''

  // Minimum required constructor
  constructor(data: Partial<User> = {}, options: Record<string, any> = {}) {
    super(data, options)
    this.init(data)
  }

  // optional for setting up data objects and/or associations
  static setupInstance(message: Partial<Message>) {
    const { store, models } = this
  }
}

const servicePath = 'users'
export const useUsers = defineStore({
  idField: 'id', // (2)
  clients: { api }, // (2)
  servicePath,
  Model: User,
})

api.service(servicePath).hooks({})
```
