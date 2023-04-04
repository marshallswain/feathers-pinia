---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Setup the Feathers Client

There are two ways to setup the Feathers Client: using a Dove client or manual setup. Note that This page shows the
most-general setup instructions. each framework page has specific implementation notes for setting up a client.

[[toc]]

## Ways to Setup

### Use a Typed Feathers Dove Client

The new [FeathersJS v5 Dove CLI](https://feathersjs.com/guides/cli/index.html) now creates [a fully-typed Feathers
Client](https://feathersjs.com/guides/cli/client.html) for you. The next examples shows what it looks like to use the
new client.

<!--@include: ../partials/notification-feathers-client.md-->

::: code-group

```ts [with Socket.io]
import { createClient } from 'feathers-pinia-api'
import socketio from '@feathersjs/socketio-client'
import io from 'socket.io-client'

const host = 'http://localhost:3030'
const socket = io(host, { transports: ['websocket'] })

export const feathersClient = createClient(socketio(socket), { storage: window.localStorage })
```

```ts [with fetch]
import { createClient } from 'feathers-pinia-api'
import rest from '@feathersjs/rest-client'

const host = 'http://localhost:3030'
window.fetch.bind(window)

export const feathersClient = createClient(rest(host).fetch(fetch), { storage: window.localStorage })
```

:::

### Manual Setup

Assuming you're using a client-side bundler, like Vite, you can copy the [Feathers Client setup instructions for
Node.js](https://feathersjs.com/api/client.html#node) to create a Feathers Client. See below for more examples.

::: code-group

```ts [with Socket.io]
import { feathers } from '@feathersjs/feathers'
import authenticationClient from '@feathersjs/authentication-client'
import socketio from '@feathersjs/socketio-client'
import io from 'socket.io-client'

const host = 'http://localhost:3030'
const socket = io(host, { transports: ['websocket'] })

export const feathersClient = feathers()
  .configure(socketio(socket))
  .configure(authenticationClient({ storage: window.localStorage }))
```

```ts [with fetch]
import { feathers } from '@feathersjs/feathers'
import authenticationClient from '@feathersjs/authentication-client'
import rest from '@feathersjs/rest-client'

const host = 'http://localhost:3030'
window.fetch.bind(window)

export const feathersClient = feathers()
  .configure(rest(host).fetch(fetch))
  .configure(authenticationClient({ storage: window.localStorage }))
```

:::

## Important Notes

### SSG Compatibility

See the [Common Patterns](/guide/common-patterns#ssg-compatible-localstorage) page to see an example of SSG-friendly
localStorage.

### Errors with Fetch Setup

If you're upgrading from Feathers v4 Crow and you receive an error like this one:

```text
"Error: Failed to execute 'fetch' on 'Window': Illegal invocation"
```

You can fix this by binding `window` to `fetch`, as is also shown in the above examples.

```ts
window.fetch.bind(window)
```
