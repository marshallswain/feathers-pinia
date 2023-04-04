---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
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

## Setting up SSR

See the [Server Side Rendering section of the `useService` docs](/guide/use-service#server-side-rendering-ssr).
