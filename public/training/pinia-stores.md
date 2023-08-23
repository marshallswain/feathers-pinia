---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Pinia Stores

[[toc]]

## Setup Stores, Only

Similar to how VueJS components can be written using the "Options API" or the "Composition API", Pinia, itself, also
supports "Options API" and "Composition API" stores, except Pinia calls "Composition API" stores "setup stores". Up
until Feathers-Pinia 2.0, only the "Options API" stores were supported. As of Feathers-Pinia 2.0, only `setup` stores
are supported. Setup stores share the same benefits of the Vue Composition API, being more flexible and easier to
customize.

## Create a "Setup" Store

To create a `setup` store, import `defineStore` from `pinia` then call it with a string for the store name followed by a
function that accepts no arguments and returns an object, as shown below. Make sure the store's name is unique to
prevent conflicts.

```ts
import { defineStore } from 'pinia'

export const useMyStore = defineStore('my-store', () => {
  // implement store logic
  return {}
})
```

Learn more about [Pinia Setup Stores](https://pinia.vuejs.org/core-concepts/#setup-stores).

## HMR Support

If you're building your app with Vite, you can utilize Pinia's `acceptHMRUpdate` to make sure your stores are properly
reloaded after a hot module swap. To implement, import `acceptHMRUpdate` from `pinia` and conditionally call it below
your store declaration block:

```ts
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useMyStore = defineStore('my-store', () => {
  // implement store logic
  return {}
})

// Adds HMR support
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMyStore, import.meta.hot))
}
```

## Store Types

Feathers-Pinia comes with two utilities for creating different types of stores:

- [useService](/data-stores/) is used to create a store that connects to a FeathersJS service.
- [useAuth](/guide/use-auth) is used to create an auth store.
