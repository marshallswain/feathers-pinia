---
layout: home
hero:
  name: Feathers-Pinia
  text:  Build Lightweight, Real-Time Vue Apps
  tagline: Connect your Feathers app to the new-generation Vue store.
  image:
    src: ./feathers-pinia.png
    alt: Feathers-Pinia Logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/setup
    - theme: alt
      text: What's New
      link: /guide/whats-new

features:
  - icon: 🍍
    title: Powered by Pinia
    details: Pinia is Vuex 5. It's a joy to use with a clean API and memorable syntax. 

  - icon: 🧁
    title: Best Practices Baked In
    details: Vue 3 + Composition API 😎 Common Redux patterns included. SWR Fall-through cache by default. Query the store like a local database.

  - icon: ⚡️
    title: Realtime by Default
    details: Realtime isn't an afterthought or add-on. With Live Queries, watch your data update as new data arrives from the Feathers server.

  - icon: 🐮
    title: SWR with more Cowbell
    details: Feathers-Pinia can intelligently re-use data across different queries, making apps feel faster. Or go realtime and make SWR obsolete.

  - icon: ➳
    title: Super Speedy Fast
    details: When paired with Vue 3, you'll enjoy a massive speed increase over the same app built with Feathers-Vuex. Really, it's huge.

  - icon: 🥷
    title: Powerful Data Modeling
    details: Define data structures. Write cleaner code with model-level computed properties.

---

<script setup lang="ts">
import Badge from './components/Badge.vue'
import pkg from '../package.json'
</script>

<div style="position: fixed; z-index: 1000; top: 2px; right: 2px;">
  <Badge :text="`v${pkg.version}`" />
</div>

<style>
.VPImage {
  max-height: 240px;
}
@screen sm {
  .VPImage {
    max-height: 320px;
  }
}
@screen md {
  .VPImage {
    max-width: 190px !important;
  }
}
@screen lg {
  .VPImage {
    max-width: 190px !important;
    max-height: initial;
  }
}
</style>
