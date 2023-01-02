---
outline: deep
---

<script setup>
import V2Block from '../components/V2Block.vue'
</script>

<V2Block />

# OFetch SSR Adapter for Feathers-Rest

[[toc]]

## Setup

Follow these setups to get the `OFetch` adapter working with your Nuxt app and the Feathers Client.

## Install `ofetch`

The `ofetch` adapter fulfills the promise of the `fetch` API, being a universal client that works on client, server, and in serverless environments.  Install it with the following command.  Note that you can put it in `devDependencies` since Nuxt makes a clean, standalone version of your project during build.

```bash
npm i ofetch -D
```

## Add to Feathers Client

Here's an example of setting up the OFetch adapter to work with Feathers-Client in a Nuxt 3 plugin:

```ts
// plugins/1.feathers.ts
import { $fetch } from 'ofetch'
import rest from '@feathersjs/rest-client'
import socketio from '@feathersjs/socketio-client'
import io from 'socket.io-client'
import { feathers } from '@feathersjs/feathers'
import { OFetch, setupFeathersPinia } from 'feathers-pinia'

export default defineNuxtPlugin(async (_nuxtApp) => {
  // Creating the Feathers client in a plugin avoids stateful data and
  // prevents information from leaking between user sessions.
  const api = feathers()
  const { defineStore } = setupFeathersPinia({
    ssr: !!process.server,
    clients: { api },
    idField: '_id',
    // customize every store
    state: () => ({}),
    getters: {},
    actions: {},
  })

  const host = import.meta.env.VITE_MYAPP_API_URL as string || 'http://localhost:3030'

  // Use Rest on the server
  // Check process.server so the code can be tree shaken out of the client build.
  if (process.server)
    api.configure(rest(host).fetch($fetch, OFetch))

  // Switch to Socket.io on the client
  else
    api.configure(socketio(io(host, { transports: ['websocket'] })))

  return {
    provide: { api, defineStore },
  }
})
```
