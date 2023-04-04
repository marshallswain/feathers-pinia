---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Stores Overview

[[toc]]

Stores are more modular in Feathers-Pinia 2.0. The Vue Composition API allows each
[Model Function](/guide/model-functions) to have its own standalone store, by default. You can also create Pinia stores
and even setup Model Functions and Pinia stores to work together.

## What to Learn

These Store-related pages teach the most important concepts for using the various types of stores available in
Feathers-Pinia.

- [Model Stores](/guide/model-stores)
  - [BaseModel stores](/guide/use-base-model-stores) gives you the core storage, and the clone and commit functionality.
  - [FeathersModel stores](/guide/use-feathers-model-stores) build on top of BaseModel stores and add Feathers-related
  functionality.
- [Pinia Stores](/guide/pinia-stores) shows you how to build `setup` stores with Pinia
  - [useService](/guide/use-data-store) is for creating service stores.
  - [useAuth](/guide/use-auth) is for creating authentication stores.
