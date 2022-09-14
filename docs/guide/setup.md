---
outline: deep
---

# Getting Started

[[toc]]

Pinia's well-designed architecture allows it to be modular while also functioning as a central store. This means that we don't have to register each service's store in a central location. Here's are the recommended steps for setting up Feathers-Pinia:

## Install Pinia and Feathers-Pinia

Install these packages using your preferred package manager.  Until version 1.0.0, it's recommended that you add a `~` in front of the version number for Feathers-Pinia to only get patch releases.

```bash
npm i pinia feathers-pinia
```

## Install Feathers

If your app will use socket.io, install these packages:

```bash
npm i @feathersjs/feathers@pre @feathersjs/authentication-client@pre @feathersjs/socketio-client@pre socket.io-client
```

If your app will use feathers-rest (no realtime connection), install these packages:

```bash
npm i @feathersjs/feathers@pre @feathersjs/authentication-client@pre @feathersjs/rest-client@pre
```

## Project Configuration

Vite will work without any configuration. Specific instructions for Quasar and Nuxt are yet to be determined, but will be an adaptation of the below.

### TypeScript

By default, TypeScript will expect you to strictly identify properties on Model classes.  See the `!` in the following example:

```ts
class UserModel extends BaseModel {
  foo!: string
  bar!: number
}
```

You can optionally configure `tsconfig.json` to not require the `!` on every property. Add the `strictPropertyInitialization` property to the `compilerOptions`:

```json
{
  "compilerOptions": {
    "strictPropertyInitialization": false,
  },
}
```

With `strictPropertyInitialization` turned off, you can declare class properties as normal:

```ts
class UserModel extends BaseModel {
  foo: string // No `!` needed after every property
  bar: number
}
```

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

## Other Setup Examples

### With `@feathersjs/memory`

You can try Feathers-Pinia without a backend by using `@feathersjs/memory`. First, you'll need to install the package:

```bash
npm i @feathersjs/memory
```

Now you only need to instantiate the memory server on the service. It takes only two lines of code!  See here:

```ts
// src/store/users.ts
import { defineStore, BaseModel } from './store.pinia'
import { api } from '../feathers'
import { memory } from '@feathersjs/memory' // import the memory module

export class User extends BaseModel {}

const servicePath = 'users'
export const useUsers = defineStore({ servicePath, Model: User })

// make a memory store for the service
api.use(servicePath, memory({ paginate: { default: 10, max: 100 }, whitelist: ['$options'] }))
api.service(servicePath).hooks({})
```

With the `memory` adapter in place, you'll be able to make requests as though you were connected to a remote server. And technically, for this service it is no longer required to have a client transport (rest or socket.io) configured.

One more thing: you can start the memory adapter with fixture data in place, if wanted. Provide the `store` option with the the data keyed by id, as shown below. You can also provide this option during instantiation.

```ts
api.use(servicePath, memory({ 
  paginate: { default: 10, max: 100 }, 
  whitelist: ['$options'], 
  store: {
    1: { id: 1, name: 'Marshall' },
    2: { id: 2, name: 'David' },
    10: { id: 10, name: 'Wolverine' },
    10: { id: 10, name: 'Gambit' },
    11: { id: 11, name: 'Rogue' },
    12: { id: 12, name: 'Jubilee' },
  } 
}))
```

The same data can be written at any time during runtime by setting `api.service('users').options.store` to the new object, keyed by id.
