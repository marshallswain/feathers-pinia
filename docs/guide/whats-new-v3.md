---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# What's New in 3.0

Feathers-Pinia 3.0 finally gives us the magical, implicit API that we enjoyed with Feathers-Vuex, but in a
smaller, implicitly modular and much faster package. This page will go over more of the highlights.

[[toc]]

## Leading in Simplicity

Complex setup is a thing of the past. Version 3 combines the best patterns from all previous versions, makes everything
implicit, and almost does your job for you.  The result is a work of art.  

You can configure all services in one line of code:

```ts
// src/feathers.ts
import { pinia } from './plugins/pinia'

const feathersClient = {} // See the Feathers Client install/setup pages
const api = createVueClient(feathersClient, { pinia, idField: '_id' })
```

That line of code gives you a lot:

- A wrapped Feathers Client
- All Feathers Service Interface methods and some extras like `findOne`, for convenience.
- All of the local, data-related store methods, with its Live Queries and Lists.
- Pinia stores created on the fly.
- Implicit Models created for you. Manually wrangling stores and Models is no longer even an option.  

Data modeling still runs the show "under the hood," and all data is turned into `Feathers` instances, by default. You
can customize instances using the `services` option of the config with a `setupInstance` method, like this:

```ts
// src/feathers.ts
import { createVueClient } from 'feathers-pinia'
import { pinia } from './plugins/pinia'

const feathersClient = {} // See the Feathers Client install/setup pages
const api = createVueClient(feathersClient, {
  pinia,
  idField: '_id',
  services: {
    users: {
      setupInstance(data: ServiceInstance<Users>) {
        return useInstanceDefaults(data, { name: '' })
      },
    },
  },
})
```

And with the above code in place you have a default `name` property on every `user`.  

### Feathers Dove TS Support 🎉

Version 3 automatically uses the TypeScript enhancements when you use it with Feathers v5 Dove. Learn more about
Feathers v5 Dove types in the Feathers documentation:

- Creating types [with TypeBox](https://feathersjs.com/api/schema/typebox.html)
- Reusing server types with [the Feathers Client](https://feathersjs.com/guides/cli/client.html)

### Big Update, Small Footprint 🐾

We kept all of the features while reducing the overall size. This means higher efficiency, with a 20% smaller footprint
than the previous version. Less code means fewer bugs. 🐞

### The One Correct Way 🥇

Version 3 builds from version 2's clean structure. It takes what we learned from v2's flexibility and focuses on a
single, correct way to do things. There's no more confusion and no need to wonder if you're using the correct API.

### Modular, Yet Centralized 📦

Building on the Feathers Client allows us to implicitly create stores only when their associated Feathers services are
used. There's no need to manually create a Pinia store. There's no need to customize stores. Instead, we use
[Pinia store composition](https://pinia.vuejs.org/cookbook/composing-stores.html).

### Huge Performance Boost 🚀

Feathers-Pinia is SO MUCH faster than its predecessor.  You'll see massive benefits from the faster reactive types under
the hood of Pinia and Vue 3. But we've gone a step further and fine-tuned and tested Feathers-Pinia to never perform
extra work. Some of the biggest improvements are:

- No unnecessary stack frames happen under the hood. We stand firmly against wasted CPU cycles!
- As from the beginning, you still have full control over adding instances to the store with `instance.createInStore()`.

### Super-Efficient SSR

SSR applications will now be especially fast. In the past, if you had an app with 30 services, you had a Pinia hydration
bundle that contained 30 services, even if you only used a few of them on a page. Since stores are now created only when
needed, the Pinia bundle contains only the services actually used to render the page.

## Just Use Services ⭐️⭐️⭐️⭐️⭐️

You can think of the Feathers Service as the Model. The Feathers-Pinia Client now replaces the service Models and Stores
APIs. All of these methods are now available directly on each Feathers Client service.

<!--@include: ../partials/service-interface.md-->

The Feathers Service is the only place to find these methods, now.

## Composition API Stores 🎉

Feathers-Pinia publishes a couple of Composition API utilities for creating Pinia
[setup stores](https://pinia.vuejs.org/core-concepts/#setup-stores).

### useAuth

Create ultra-flexible auth stores with the new [useAuth](/guide/use-auth) utility.

```ts
// src/store/store.auth.ts
import { acceptHMRUpdate, defineStore } from 'pinia'
import { useAuth } from 'feathers-pinia'

export const useAuthStore = defineStore('auth', () => {
  const { api } = useFeathers()
  const auth = useAuth({ api, servicePath: 'users' })

  auth.reAuthenticate()

  return auth
})
```

Learn more about the new [useAuth utility](/guide/use-auth)

### useDataStore

The `useDataStore` utility allows creating your own data stores with the same shape as service stores. You only need
this if you want to manage non-Feathers data with the same API.

Learn more about the new [useDataStore utility](/data-stores/).

## Implicit Data Modeling

Data modeling is one of the most-loved features in Feathers-Pinia.  Version 2.x introduced Model Functions instead of
Classes. Now in v3 model functions are implicitly created for you. You can customize them by providing a `setupInstance`
function in the individual service options.

### useInstanceDefaults 🎁

You can define default values for instances using the `useInstanceDefaults`. This takes the place of the former
BaseModel class's `instanceDefaults` method.

Learn more about the new [useInstanceDefaults utility](/guide/use-instance-defaults)

## Nuxt Module ⚡️

Feathers-Pinia comes with a module for Nuxt which registers auto-imports. Learn more about the new
[Nuxt Module](/guide/nuxt-module)

## Auto-Imports ⚡️

Since Feathers-Pinia v2 is so modular, import statements can be verbose. New Auto-Import support for Nuxt, Vite,
Webpack, Rollup, and more, is provided through the new `unplugin-auto-imports` preset.

Learn more about the new [Auto-Imports Support](/guide/auto-imports).

## Improved Querying

### All [sift](https://github.com/crcn/sift.js/) operators enabled

These operators are now enabled for store queries, by default:

- [$eq](https://github.com/crcn/sift.js/#eq)
- [$ne](https://github.com/crcn/sift.js/#ne)
- [$mod](https://github.com/crcn/sift.js/#mod)
- [$all](https://github.com/crcn/sift.js/#all)
- [$nor](https://github.com/crcn/sift.js/#nor)
- [$not](https://github.com/crcn/sift.js/#not)
- [$size](https://github.com/crcn/sift.js/#size)
- [$type](https://github.com/crcn/sift.js/#type)
- [$regex](https://github.com/crcn/sift.js/#regex)
- [$where](https://github.com/crcn/sift.js/#where)
- [$elemMatch](https://github.com/crcn/sift.js/#elemmatch)

Learn more on the [Querying Data](/data-stores/querying-data#all-sift-operators-enabled-locally) page.

### Query API Reference 📖

The documentation now includes a page about supported query props. It's a great reference for what query props are
supported by:

- the Feathers Query Syntax (all adapters)
- the [@feathersjs/mongodb](https://feathersjs.com/api/databases/mongodb.html) adapter
- the [@feathersjs/knex](https://feathersjs.com/api/databases/knex.html) adapter
- other SQL-based adapters

Learn more on the new [Querying Data](/data-stores/querying-data) page.

### SQL `$like` Operators 🎁

The most-requested feature has finally landed: built-in support for SQL `LIKE`. This means the queries made to the store
will match the queries made to your SQL-backed API. This brings querying features up to parity with the built-in MongoDB
support which uses the `$regex` key.

These are the newly-supported SQL operators:

- `$like` and `$notLike` for case-sensitive matches
- `$ilike`, `$iLike`, and `$notILike` for case-insensitive matches

Let's have a look at them in action. First, assume that we have the following messages in the store:

```json
[
  { "id": 1, "text": "Moose" },
  { "id": 2, "text": "moose" },
  { "id": 3, "text": "Goose" },
  { "id": 4, "text": "Loose" }
]
```

Now see the fancy new query operators in action:

```ts
const { api } = useFeathers()

// $like
const messages$ = api.service('messages').findInStore({
  query: { text: { $like: '%Mo%' } }
})
expect(messages$.data.map(m => m.id)).toEqual([1])
```

```ts
// $notLike
const messages$ = api.service('messages').findInStore({
  query: { text: { $notLike: '%Mo%' } }
})
expect(messages$.data.map(m => m.id)).toEqual([2, 3, 4])
```

```ts
// $ilike
const messages$ = api.service('messages').findInStore({
  query: { text: { $ilike: '%Mo%' } }
})
expect(messages$.data.map(m => m.id)).toEqual([1, 2])
```

```ts
// $iLike
const messages$ = api.service('messages').findInStore({
  query: { text: { $iLike: '%Mo%' } }
})
expect(messages$.data.map(m => m.id)).toEqual([1, 2])
```

```ts
// $notILike
const messages$ = api.service('messages').findInStore({
  query: { text: { $notILike: '%Mo%' } }
})
expect(messages$.data.map(m => m.id)).toEqual([3, 4])
```

These new operators support queries made with SQL-backed adapters like the official, core SQL service adapter in
Feathers v5 Dove:

- [@feathersjs/knex](https://dove.feathersjs.com/api/databases/knex.html)

These adapters will also work:

- [feathers-knex](https://github.com/feathersjs-ecosystem/feathers-knex), the Feathers v4 Crow version of `@feathersjs/knex`, above
- [feathers-objection](https://github.com/feathersjs-ecosystem/feathers-objection)
- [feathers-sequelize](https://github.com/feathersjs-ecosystem/feathers-sequelize)

If you use any of the above database adapters, give the new query operators a try!  Enjoy your new superpowers!

Read more about all supported query filters and operators on the [Querying Data](/data-stores/querying-data) page.

### Custom Local Query Operators

You can now register your own custom operators for store queries, allowing more flexibility of how to filter store data.
This is done using the `customSiftOperators` configuration option.

See the [createPiniaClient](/guide/create-pinia-client) documentation.

### params.clones

You can now pass `params.clones` to either `findInStore` or `getFromStore` to return all matching data as clones of the
original data. This was formerly known as `params.copies` in Feathers-Vuex.

Learn more in the [Querying Data page](/data-stores/querying-data#params-clones)

## Built-in Patch Diffing 🎁

<!--@include: ../partials/patch-diffing.md-->

Read more about [FeathersModel Instances](/services/instances)

## Reactive Instances ➕

Thanks to the built-in modeling API, all instances are now always reactive, even when not added to the store.

```ts
const { api } = useFeathers()
const task = api.service('tasks').new({
  description: 'Bind me to a template. I am ready.'
})
```

## Handle Associations

Update: `storeAssociated` has been replaced by new lower-level [Data Modeling utilities](/guide/data-modeling) in 
Feathers-Pinia 4.2.

Use the [modeling utilities](/guide/utilities) to define associations on your data. The new methods assure that new
instances are not enumerable, so they won't be sent to the API server. ~~The [storeAssociated](/guide/store-associated) utility
automatically distributes related data into correct service stores with a simple config.~~

## New `service.useFind` API 🎁

The best parts of the former `useFind` and `useFindWatched` APIs have been combined into `service.useFind`. A couple of
its best features include

- **Intelligent Fall-Through Caching** - Like SWR, but way smarter.
- **Pagination Support** - Built in, sharing the same logic with `usePagination`.

See all of the features on the [Service API page](/services/).

## Removals ➖

The following APIs are no longer available:

### No `update` method

The `service.update` method from the Feathers Service Interface is not implemented, since `service.patch` can more
flexibly handle the same functionality and enables nice features like patching diffing.

### Service Methods out of Store

The service stores are now just data stores. There's no more fetching data through the store. Just use the Feathers
Client services:

```ts
const { api } = useFeathers()

api.service('contacts').findInStore({ query: { $limit: 100, $skip: 0 } })
```

### useFeathersModel

Creating standalone model functions has been replaced by each service's `new` method. You can create instances by calling
`service.new(data)`.

### useBaseModel

The `useBaseModel` utility has also been removed in favor of the service's `new` method.

### usePagination

This composition API utility is now baked into `service.useFind`.

### useFindWatched

This method has been removed. Use the `service.useFind` API, instead.

### useGetWatched

This method has been removed. Use the `service.useGet` and `service.useGetOnce` APIs, instead.

### LZW Storage is Out

Prior to this version, Feathers-Pinia included a localStorage plugin that used LZW compression. It came with the benefit
of doubling the amount of data you could put in storage. The downside was that it made the bundle size big, so we
removed it.  It will be published as an independent package at a later date.

Our LocalStorage adapter remains part of the package and is so fast that it makes Single Page Apps feel like they're
doing Server Side Rendering.  If you haven't tried it, yet, it's easy to setup and it's worth it!

### No More `defineAuthStore`

The <a href="#useauth-🎁">useAuth</a> utility takes the place of `defineAuthStore`.

See how to [migrate from defineAuthStore to useAuth](/migrate/from-v0#no-more-defineauthstore)

### No `instance.update()` method

The rarely-used `update` method has been removed from the instance interface. Use the patch method, instead, to take
advantage of patch diffing and partial updates.  You can still replace an entire object by just sending all of the data
through `patch`. The Model Functions and Feathers-connected stores continue to have an `update` method, which an also
be used.
