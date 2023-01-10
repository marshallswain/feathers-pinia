---
outline: deep
---
# Introduction

[[toc]]

Welcome to the apex of Vue Data Modeling and FeathersJS connectivity for the artisan developer. Feathers-Pinia is
**the** first-class data modeling solution built with the Vue Composition API. It is well known for its features which
maximize perceived application speed for end users while providing a pleasant developer experience.

## Overview of Features

- **[Data Modeling](/guide/modeling-overview)** using pure functions with **stellar TypeScript Support**.
- **[Model Associations](/guide/model-associations)** with the new [associateFind](/guide/associate-find) and
[associateGet](/guide/associate-get) utilities.
- **[Clone and Commit](/guide/common-patterns#mutation-multiplicity-pattern)** support for keeping mutation count low.
- **[Per-Record Defaults](/guide/model-functions-shared#useinstancedefaults)** offer a functional way of adding default
values to every record.
- **Realtime by Default**: It's ready for WebSocket-enhanced, multi-user interactivity.
- **Independently Reactive**: no need to assign records to component or store `data` to enable reactive binding.
- **[Local Queries](/guide/querying-data)**: Make requests against locally-cached data as though it was a FeathersJS
database, **now with support for SQL `$like` operators.**
- **[Live Queries](/guide/common-patterns.html#reactive-lists-with-live-queries)** with client-side pagination allow
arrays of data to automatically update as new records are added, modified, or removed.
- **[Server-Side Pagination](/guide/use-find#server-paging-auto-fetch)**: alternative to live-list pagination,
optionally give all control to the server and perform manual fetching. In this mode, lists only update when new queries
are made.
- **[SSR Support](/guide/use-service#server-side-rendering-ssr)**: optimize server-loaded data on the client without
refetching. The latest Nuxt APIs are fully supported.
- **[Fall-Through Cache](/guide/use-find)** like SWR but with built-in, low-memory query intelligence. It knows which
records can be shared between different queries, which allows relevant records to show immediately while additional data
is fetched.
- Flexible code patterns allow developers to work as they wish.
  - **Active Record Pattern**: allows use of utility methods built on each instance. This pattern allows creation of
  loosely-coupled components built around the instance interface.
  - **Data Mapper Pattern**: allows you to use a store-centric workflow where you let store logic perform operations
  on your data.
- **[Flexible Auth Support](/guide/use-auth)** with the new `useAuth` composition utility.
- New utilities for data fetching and [working with form data](/guide/use-clones), fully powered by the Vue Composition
API.
- Full support for [FeathersJS v5 Dove](https://feathersjs.com).

While built for Pinia, it has evolved to support standalone configurations not requiring Pinia. Both the standalone and
Pinia-based workflows are first-class integrations with almost 100% feature parity. Pinia-based setups support easy SSR
integration.

## Coming from Feathers-Vuex

Feathers-Pinia is the next generation of [Feathers-Vuex](https://vuex.feathersjs.com). The difference is that it's built on [Pinia](https://pinia.esm.dev/): a Vue store with an intuitive API.

Using Pinia in your apps will have a few positive effects:

- The clean API requires lower mental overhead to use.
  - No more weird Vuex syntax.
  - No more mutations; just actions.
  - Use Composable Stores instead of injected rootState, rootGetters, etc.
- Lower mental overhead means developers spend more time in a creative space. This usually results in an increase of productivity.
- You'll have smaller bundle sizes. Not only is Pinia tiny, it's also modular. You don't have to register all of the plugins in a central store. Pinia's architecture enables tree shaking, so only the services needed for the current view need to load.

See the Migration Guide for developers [coming from Feathers-Vuex](/guide/migrate-from-feathers-vuex).
