# Setup

Pinia's well-designed architecture allows it to be modular while also functioning as a central store. This means that we don't have to register each service's store in a central location. Here's are the recommended steps for setting up Feathers-Pinia:

[[toc]]

## Install Pinia

Install these packages using your preferred package manager:

```
pinia feathers-pinia
```

## Install Feathers

If your app will use socket.io, install these packages:

```
@feathersjs/feathers @feathersjs/authentication-client feathers-hooks-common @feathersjs/socketio-client  socket.io-client
```

If your app will use feathers-rest (no realtime connection), install these packages:

```
@feathersjs/feathers @feathersjs/authentication-client feathers-hooks-common @feathersjs/rest-client
```

## Project Configuration

Vite will work without any configuration. Instructions for Quasar, Nuxt, and Vue CLI are yet to be determined.

## Setup

### Feathers Client(s)

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
import feathers from '@feathersjs/feathers'
import rest from '@feathersjs/rest-client'
import auth from '@feathersjs/authentication-client'

// The variable name of each client becomes the alias for its server.
export const api = feathers()
  .configure(rest('http://localhost:3030').fetch(fetch))
  .configure(auth())

export const analytics = feathers()
  .configure(rest('http://localhost:3031').fetch(fetch))
  .configure(auth())
```

### Pinia

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

### Service Stores

Now that we've created the main `pinia` store, we are ready to setup our first service. Here's an example that creates a User class and connects it to the `users` service. This next example uses the global configuration, so it won't work well for SSR:

```ts
// src/store/users.ts
import { defineStore, BaseModel } from './store.pinia'
import { api } from '../feathers'

export class User extends BaseModel {}

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

export class User extends BaseModel {}

const servicePath = 'users'
export const useUsers = defineStore({
  idField: 'id', // (2)
  clients: { api }, // (2)
  servicePath,
  Model: User,
})

api.service(servicePath).hooks({})
```
