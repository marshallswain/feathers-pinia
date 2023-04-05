---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Setup the Feathers-Pinia Client

If you already have a Feathers Client setup, you're ready to create a Feathers-Pinia client. This page will show you
just how simple it is.

If you don't have a Feathers Client setup, yet, you'll need to [install](./install) and [set one up](./feathers-client.md).

## Create a Vue Client

Use the [createPiniaClient](/client/create-pinia-client) module to initialize a Feathers-Pinia client. Below is a generic
example. See the Framework examples for framework-specific implementations.

```ts
// src/feathers.ts
import { createPiniaClient } from 'feathers-pinia'
import { pinia } from './plugins/pinia'

const feathersClient = {} // See the Feathers Client install/setup pages
const api = createPiniaClient(feathersClient, { 
  pinia, 
  idField: '_id',
  // optional
  ssr: false,
  whitelist: [],
  paramsForServer: [],
  skipGetIfExists: true,
  customSiftOperators: {},
  services: {},
})
```

See a full explanation of options on the [createPiniaClient](/client/create-pinia-client) page.

The above code wraps the `feathersClient` into a Feathers-Pinia turbocharged client. To create or reference a store, you
just use the service like you would with a plain Feathers Client:

```ts
// Creates a 'users' service store and fetches data
api.service('users').get(1)
```

See the next pages to learn how to integrate with your framework.
