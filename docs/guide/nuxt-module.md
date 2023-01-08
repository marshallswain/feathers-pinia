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

# Nuxt Module

[[toc]]

Feathers-Pinia v2 comes with a Nuxt Module, which currently works with [Nuxt 3](https://nuxt.com). It provides two main
features:

- Auto-import configuration for key Feathers-Pinia exports.
- Composables for working with Feathers-Pinia and Nuxt.

You can read more about [which modules are available as auto-imports](/guide/auto-imports).

<BlockQuote>

Working with Nuxt requires the use of Pinia stores.

</BlockQuote>

## Installation

The Nuxt module has [its own package](https://npmjs.com/package/nuxt-feathers-pinia) to install alongside
`feathers-pinia`:

```bash
npm i nuxt-feathers-pinia
```

Once installed, add its name to the `nuxt.config.ts` file. It's also recommended that you add the `imports`
configuration, shown below, to allow you to keep `models` and `stores` in their own folder, since they are different
than other composables. Apart from keeping your project well organized, this also enables auto-imports in those folders.

```ts
// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
    'nuxt-feathers-pinia',
  ],
  // Allows you to put stores and models in their own folders
  imports: {
    dirs: [
      'stores',
      'models',
    ],
  },
  // Enable Nuxt Takeover Mode: https://nuxt.com/docs/getting-started/installation#prerequisites
  typescript: {
    shim: false,
  },
  // optional: https://vuejs.org/guide/extras/reactivity-transform.html
  experimental: {
    reactivityTransform: true,
  },
})
```

## Nuxt-Specific Composables

When you use `nuxt-feathers-pinia`, three of the [Auto-Import Composables](/guide/auto-imports#model-composition-utilities)
are replaced by SSR/SSG/Hybrid-ready versions with the same API.

When you register the `nuxt-feathers-pinia` module on your app, it creates an object called `$fp` on the NuxtApp object
during every request. This means the NuxtApp is a safe place to use for per-request app state, which is perfect for
Server-Side Rendering (SSR) and Static Site Generation (SSG).
