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
      text: Start a Project
      link: /setup/

features:
  - icon: 🕊️
    title: FeathersJS v5 Dove Support
    details: Feathers-Pinia v3 now directly wraps the Feathers Client. Effortlessly use types directly from your backend API.

  - icon: 🍍
    title: Powered by Pinia
    details: It's a joy to use with a clean API and memorable syntax. It's also crazy fast. Really, the speed difference is ludicrous. ➳

  - icon: 🧁
    title: Best Practices Baked In
    details: Vue 3 + Composition API 😎 Common Redux patterns built in. Intelligent Fall-Through Cache. Query the store like a local database.

  - icon: ⚡️
    title: Realtime by Default
    details: Realtime isn't an afterthought. Live Queries mean your UI updates as new data arrives from the Feathers server. No effort required.

  - icon: 🐮
    title: SWR with more Cowbell
    details: Feathers-Pinia can intelligently re-use data across different queries, making apps feel faster. Go Realtime and make SWR obsolete!

  - icon: 🥷
    title: Data Modeling Beyond Class
    details: v3.0 brings simplified setup and implicit Data Modeling. We've ditched classes for functions and baked it into the Feathers Client.

---

<script setup>
import Badge from './components/Badge.vue'
import pkg from '../package.json'
</script>

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
