---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Data Modeling Overview

[[toc]]

## Why Data Modeling

Data Modeling is the most important feature of Feathers-Pinia. The Vue Composition API allowed us to create Vue's
missing data modeling layer. Having an independent modeling layer cleans up our components and stores while also proving
great TypeScript support.

If you're not using a data modeling layer then you are inevitably coupling your data model with your components or
stores (or probably a dirty mix of both).

In Feathers-Pinia 2.0, the Model Classes have been replaced with Model Functions. Since functions in JavaScript (and TS)
are also objects, we take advantage of putting "static" methods on the Model interface.

<BlockQuote label="The Power of Interfaces">

The Model Function API provides a common interface that abstracts away the underlying implementation. This is similar
to how FeathersJS database adapters work. FeathersJS supports many database adapters. By swapping out an adapter, the
same code that was previously running on one database now runs on some other database.

</BlockQuote>

## What to Learn

These Data Modeling pages teach the most important concepts for implementing cleaner code patterns with Feathers-Pinia.

- [Model Functions](/guide/model-functions) which enhance records with metadata and handy functionality. There are two
built-in Model functions:
  - [BaseModel](/guide/use-base-model) gives you the core functionality of storage (including temporary records), and
  the clone and commit pattern.
  - [FeathersModel](/guide/use-feathers-model) gives you all BaseModel functionality and adds utils for connecting to
  FeathersJS APIs.
  - [Shared Utils](/guide/model-functions-shared) covers utilities that can be used in any type of Model Function.
- [Model Instances](/guide/model-instances) are created by Model functions. Each instance has its own API, providing
information and functionality directly from the instance.
  - [BaseModel Instances](/guide/use-base-model-instances) are created by BaseModel functions.
  - [FeathersModel Instances](/guide/use-feathers-model-instances) are created by FeathersModel functions.
- Modeling Associations between data is accomplished through two utilities:
  - [associateFind](/guide/associate-find) creates one-to-many associations based on a FeathersJS query.
  - [associateGet](/guide/associate-get) create one-to-one associations based on an id.
- The [common patterns](/guide/common-patterns) section gives some examples of how utilities might be used.
