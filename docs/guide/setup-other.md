---
outline: deep
---

<script setup>
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Other Setup Examples

[[toc]]


## With `@feathersjs/memory`

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


## Server-Side Rendering (SSR)

Server-Side Rendering support is built into the service module and doesn't require much to enable. The main requirement is to set `ssr: true` (usually based on an environment variable) when setting up the service store on the server:

```ts
import { defineStore, BaseModel } from 'feathers-pinia' // (1)
import { api } from '../feathers'

export class User extends BaseModel {
  // Truncated. See examples, above.
}

const servicePath = 'users'
export const useUsers = defineStore({
  ssr: true, // pass in an environment variable that evaluates to `true` ONLY ON THE SERVER.
  idField: 'id',
  clients: { api },
  servicePath,
  Model: User,
})

api.service(servicePath).hooks({})
```

As long as the `ssr` option evaluates to `true` on the server and `false` on the client, SSR support will work correctly in Feathers-Pinia.