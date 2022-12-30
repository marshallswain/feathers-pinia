---
layout: home
hero:
  name: Feathers-Pinia
  text:  Build Lightweight, Real-Time Vue Apps
  tagline: Outstanding Data Modeling for FeathersJS and Next-Generation Vue
  image:
    src: ./feathers-pinia.png
    alt: Feathers-Pinia Logo
  actions:
    - theme: brand
      text: What's New
      link: /guide/whats-new
    - theme: alt
      text: Get Started
      link: /guide/

features:
  - icon: 🕊️
    title: FeathersJS v5 Dove Support
    details: Feathers-Pinia has been completely rewritten with the Vue Composition API. Use types directly from your backend API.

  - icon: 🍍
    title: Powered by Pinia
    details: It's a joy to use with a clean API and memorable syntax. It's also crazy fast. Really, the speed difference is ludicrous. ➳

  - icon: 🧁
    title: Best Practices Baked In
    details: Vue 3 + Composition API 😎 Common Redux patterns included. SWR Fall-through cache by default. Query the store like a local database.

  - icon: ⚡️
    title: Realtime by Default
    details: Realtime isn't an afterthought or add-on. With Live Queries, watch your data update as new data arrives from the Feathers server.

  - icon: 🐮
    title: SWR with more Cowbell
    details: Feathers-Pinia can intelligently re-use data across different queries, making apps feel faster. Or go realtime and make SWR obsolete.

  - icon: 🥷
    title: Data Modeling Beyond Class
    details: v2.0 has all-new Functional Data Modeling. We've ditched classes for functions and we're all happier. Write cleaner code.

---

<script setup>
import Badge from './components/Badge.vue'
import pkg from '../package.json'
</script>

<div style="position: fixed; z-index: 1000; top: 2px; right: 2px;">
  <Badge :label="`v${pkg.version}`" />
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
