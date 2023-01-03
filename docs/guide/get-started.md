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

# Start a Project

[[toc]]

## Install Modules

You'll need to [Install Modules](/guide/setup) no matter which framework you choose.

## Framework Install Guides

We have full documentation for the following frameworks.

### Vite + Vue

Follow the [Vite + Vue](/guide/setup-vite) setup guide for Single Page Apps (SPA)

### Nuxt 3

Our [Nuxt 3](/guide/setup-nuxt3) guide works for SPA, SSG, SSR, or hybrid-rendered apps.

### Quasar

Currently incomplete, the [Quasar](/guide/setup-quasar) guide is the next priority.

## Example Applications

We have [full example applications](/guide/example-apps) for each of the completed framework integrations.

## Other Examples

Examples on the [Other Setup Examples](/guide/setup-other) page include

- Working with @feathersjs/memory
- Setting up custom SSR
