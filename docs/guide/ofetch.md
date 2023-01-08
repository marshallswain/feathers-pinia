---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import pkg from '../../package.json'
import BlockQuote from '../components/BlockQuote.vue'
</script>

<div style="position: fixed; z-index: 1000; top: 2px; right: 2px;">
  <Badge :label="`v${pkg.version}`" />
</div>

# OFetch SSR Adapter for Feathers-Rest

[[toc]]

The Nuxt team created a truly universal `fetch` API in the form of [ofetch](https://github.com/unjs/ofetch). It's a
great replacement for [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) in the browser and Node's
[undici](https://www.npmjs.com/package/undici) on the server. It has a slightly different response API, eliminating the
need to `await` the response then also `await` the format (`.text` or `.json`).

Since the API is slightly different than native browser fetch API, we've made a custom adapter for Feathers-Rest.

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
import { createClient } from 'feathers-pinia-api'

// rest imports for the server
import { $fetch } from 'ofetch'
import rest from '@feathersjs/rest-client'
import { OFetch } from 'feathers-pinia'

// socket.io imports for the browser
import socketio from '@feathersjs/socketio-client'
import io from 'socket.io-client'

/**
 * Creates a Feathers Rest client for the SSR server and a Socket.io client for the browser.
 * Also provides a cookie-storage adapter for JWT SSR using Nuxt APIs.
 */
export default defineNuxtPlugin(async (_nuxtApp) => {
  const host = import.meta.env.VITE_MYAPP_API_URL as string || 'http://localhost:3030'

  // Store JWT in a cookie for SSR.
  const storageKey = 'feathers-jwt'
  const jwt = useCookie<string | null>(storageKey)
  const storage = {
    getItem: () => jwt.value,
    setItem: (val: string) => jwt.value = val,
    removeItem: () => jwt.value = null,
  }

  // Use Rest for the SSR Server and socket.io for the browser
  const connection = process.server
    ? rest(host).fetch($fetch, OFetch)
    : socketio(io(host, { transports: ['websocket'] }))

  // create the api client
  const api = createClient(connection, { storage, storageKey })

  return {
    provide: { api },
  }
})

```
