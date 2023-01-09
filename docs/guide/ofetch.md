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

<!--@include: ./nuxt-feathers-client-example.md-->