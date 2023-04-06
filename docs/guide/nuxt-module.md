---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Nuxt Module

[[toc]]

Feathers-Pinia v3 comes with a Nuxt Module. It provides two main features:

## Installation

Install the Nuxt module [from npm](https://npmjs.com/package/nuxt-feathers-pinia):

```bash
npm i nuxt-feathers-pinia
```

Once installed, add its name to the `nuxt.config.ts` file. You can optionally use the `dirs` key to enable auto-imports
in other directories (in addition to `/composables`.)

<!--@include: ../partials/nuxt-config.md-->

<!--@include: ../partials/auto-imports-overview.md-->
