---
outline: deep
---

<script setup>
import BlockQuote from '../components/BlockQuote.vue'
</script>

# What's New in 2.0

Feathers-Pinia 2.0 is a huge update with some great new features.  This page will go over some of the highlights.

[[toc]]

## Huge Performance Boost 🚀

Feathers-Pinia is SO MUCH faster than its predecessor.  You'll see massive benefits from the faster reactive types under
the hood of Pinia and Vue 3. But we've gone a step further and fine-tuned and tested Feathers-Pinia to never perform
extra work. Some of the biggest improvements are:

- No unnecessary stack frames happen under the hood. We stand firmly against wasted CPU cycles!
- As from the beginning, you still have full control over adding instances to the store with `new User().addToStore()`.
- For the features that require objects to be in the store (for example, `useClones`) feathers-pinia will implicitly
add items to the store when needed.

## Composition API Stores 🎉

Feathers-Pinia has been completely rewritten as a set of Composition API utilities for creating Pinia
[setup stores](https://pinia.vuejs.org/core-concepts/#setup-stores). The advantages include a better TypeScript
experience, cleaner customization, and fewer limitations.

### useService 🎁

The new `useService` utility takes the place of the Feathers-Pinia `defineStore` utility (not to be confused Pinia's
`defineStore` utility)  and gives you a starting point for defining your own setup store for each service. The object
returned from calling `useService` has the same shape as service stores from older versions.

The `useService` utility only requires a Feathers service and not the full Feathers client instance, anymore. It also
requires the use of a Model Function, which is covered further down this page and not shown in this example. This
example shows the creation and instantiation of a setup store with `userService`:

```ts
import { defineStore, createPinia } from 'pinia'

const pinia = createPinia()

// Create a tasks store
export const useTaskStore = defineStore('tasks', () => {
  const serviceUtils = useService<TaskInstance, TasksData, TasksQuery, typeof modelFn>({
    service,
    idField: '_id',
    Model: Task, // see the section on Model Functions
  })

  return { ...serviceUtils }
})

const taskStore = useTaskStore(pinia)
```

To customize a `setup` store, you declare additional variables, computed properties, and functions inside of the call to
`defineStore`.

Learn more about the new [useService utility](/guide/use-service).

### useAuth 🎁

Create ultra-flexible `setup stores` with the new [useAuth](/guide/use-auth) utility:

```ts
// src/store/store.auth.ts
import { defineStore, acceptHMRUpdate } from 'pinia'
import { useAuth } from 'feathers-pinia'

export const useAuthStore = defineStore('auth', () => {
  const { userStore } = useUserStore()
  const { $api } = useFeathers()

  const auth = useAuth({
    api: $api,
    userStore,
  })

  auth.reAuthenticate()

  return auth
})
```

Learn more about the new [useAuth utility](/guide/use-auth)

## Feathers v5 Dove TS Support 🎉

The new utilities in Feathers-Pinia 2.0 bring support for the new TypeScript enhancements in Feathers v5 Dove. Now you
can directly import the types from your backend and use them in your Feathers-Pinia frontend. The types integrate
directly into the new Model Functions, as well.

Learn more about Feathers v5 Dove types in the Feathers documentation:

- Creating types [with TypeBox](https://feathersjs.com/api/schema/typebox.html)
- Reusing server types with [the Feathers Client](https://feathersjs.com/guides/cli/client.html)

## Model Functions, not Classes 🔮

Data modeling is one of the most-loved features in Feathers-Pinia. In Feathers-Pinia 2.0, we replace Model Classes
with Model Functions. The developer experience just go so much better! You just create a function that receives an
object, performs modifications to it, then returns it. There are two utilities for wrapping Model Functions:
`useFeathersModel` and `useBaseModel`.

Learn more about [Model Functions](/guide/model-functions)

### useFeathersModel 🎁

The `useFeathersModel` utility is most similar to the old BaseModel class from FeathersVuex and previous versions of
Feathers-Pinia. You get the full Feathers service experience.  Feathers Models have Feathers-related methods, like
`find`, `count`, `get`, etc., directly on the model interface.

<!--@include: ./types-notification.md-->

```ts
import type { Tasks, TasksData, TasksQuery } from 'my-feathers-api'
import { type ModelInstance, useFeathersModel, useInstanceDefaults } from 'feathers-pinia'
import { api } from '../feathers'

const modelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({ description: '', isComplete: false }, data)
  return withDefaults
}
const Task = useFeathersModel<Tasks, TasksData, TasksQuery, typeof modelFn>(
  { name: 'Task', idField: '_id', service },
  modelFn,
)
```

Models now come with a lightweight, built-in store. This means that they work without a Pinia store, but you give up the
Pinia devtools compatibility. To upgrade to a full Pinia store, use the `setStore` method to provide the instantiated
pinia store:

```ts
// upgrading the Task Model's store to be a Pinia store
Task.setStore(taskStore)
```

To create a model "instance" you just call the function WITHOUT the `new` operator:

```ts
const task = Task({ description: 'Do the dishes' })
```

Learn more about the new [useFeathersModel utility](/guide/use-feathers-model)

### useBaseModel 🎁

The `useBaseModel` utility gives you all of the BaseModel functionality without the Feathers parts. This means you can
work with non-service data using the same APIs. Base model functions also come with a built-in store, and you can even
perform queries on the data with store getters.  Also, `useBaseModel` instances come with `clone`, `commit` and `reset`
methods.

<!--@include: ./types-notification.md-->

```ts
import type { Tasks, TasksData, TasksQuery } from 'my-feathers-api'
import { type ModelInstance, useBaseModel, useInstanceDefaults } from 'feathers-pinia'

const modelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({ description: '', isComplete: false }, data)
  return withDefaults
}
const Task = useBaseModel<Tasks, TasksQuery, typeof modelFn>({ name: 'Task', idField: '_id' }, modelFn)
```

BaseModel functions also have a store, which can be upgraded to a full Pinia store using the `setStore` method:

```ts
// upgrading the Task Model's store to be a Pinia store
Task.setStore(taskStore)
```

To create a model "instance" you just call the function WITHOUT the `new` operator:

```ts
const task = Task({ description: 'Do the dishes' })
```

Learn more about the new [useBaseModel utility](/guide/use-base-model)

### useInstanceDefaults 🎁

You can define default values for instances using the `useInstanceDefaults`. This takes the place of the former
BaseModel class's `instanceDefaults` method.

Learn more about the new [useInstanceDefaults utility](/guide/model-functions-shared#useinstancedefaults)

### useFeathersInstance 🎁

There's also a `useFeathersInstance` utility which you can use with `useBaseModel`. It's used inside of your Model
function to update a model instance to support Feathers-related methods, like `instance.save()`.

Learn more about the new [useFeathersInstance utility](/guide/model-functions-shared#usefeathersinstance)

## Feathers Client Hooks 🪝

Feathers-Pinia now fully integrates with the Feathers Client through a new set of `feathersPiniaHooks`. The majority of
the store logic was moved into the hooks, so you get the same experience whether you use the Feathers client, the Model
Functions, or the store methods.  The hooks are required in order for Feathers-connected Models or stores to work.

The above example builds on the Model function that was created in the previous `useFeathersModel` example. For an
all-in-one example, see one of the setup pages.

```ts
import { feathersPiniaHooks } from 'feathers-pinia'
import { api } from '../feathers'

/* setup the Model function as shown earlier */

// Pass the model function to the utility in the `around all` hooks.
api.service('tasks').hooks({ around: { all: [...feathersPiniaHooks(Task)] } })
```

Learn more about the new [hooks for Feathers Client](/guide/hooks).

## Support SQL `$like` Operators 🎁

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
  { "id": 4, "text": "Loose" },
]
```

Now see the fancy new query operators in action:

```ts
import { useMessages } from '../stores/messages'
const messageStore = useMessages

// $like
const { data: data1 } = messageStore.findInStore({
  query: { text: { $like: '%Mo%' } }
})
expect(data1.map((m) => m.id)).toEqual([1])

// $notLike
const { data: data2 } = messageStore.findInStore({
  query: { text: { $notLike: '%Mo%' } }
})
expect(data2.map((m) => m.id)).toEqual([2, 3, 4])

// $ilike
const { data: data3 } = messageStore.findInStore({
  query: { text: { $ilike: '%Mo%' } }
})
expect(data3.map((m) => m.id)).toEqual([1, 2])

// $iLike
const { data: data4 } = messageStore.findInStore({
  query: { text: { $iLike: '%Mo%' } }
})
expect(data4.map((m) => m.id)).toEqual([1, 2])

// $notILike
const { data: data5 } = messageStore.findInStore({
  query: { text: { $notILike: '%Mo%' } }
})
expect(data5.map((m) => m.id)).toEqual([3, 4])
```

These new operators support queries made with SQL-backed adapters like the official, core SQL service adapter in
Feathers v5 Dove:

- [@feathersjs/knex](https://dove.feathersjs.com/api/databases/knex.html)

These adapters will also work:

- [feathers-knex](https://github.com/feathersjs-ecosystem/feathers-knex), the Feathers v4 Crow version of `@feathersjs/knex`, above
- [feathers-objection](https://github.com/feathersjs-ecosystem/feathers-objection)
- [feathers-sequelize](https://github.com/feathersjs-ecosystem/feathers-sequelize)

If you use any of the above database adapters, give the new query operators a try!  Enjoy your new superpowers!

Read more about all supported query filters and operators on the [Querying Data](/guide/querying-data) page.

## Built-in Patch Diffing 🎁

<!--@include: ./patch-diffing.md-->

Read more about [FeathersModel Instances](/guide/use-feathers-model-instances)

## Reactive Model Instances ➕

Thanks to the Model Function API, all Model instances are now always reactive, even when not added to the store.

```ts
import { Task } from '../models/task'

const task = Task({ description: 'Bind me to a template. I am ready.' })
```

Read more about [Model Instances](/guide/model-instances).

## No `instance.update()` method ➖

The rarely-used `update` method has been removed from the instance interface. Use the patch method, instead, to take
advantage of patch diffing and partial updates.  You can still replace an entire object by just sending all of the data
through `patch`. The Model Functions and Feathers-connected stores continue to have an `update` method, which an also
be used.

Read more about [Model Instances](/guide/model-instances).

## Handle Associations

Two new utilities make it easier to add relationships between records without depending on associations in-memory.  You can setup associations in both directions between models.

Read more about [Association Patterns](/guide/model-associations.html).

### `associateFind` 🎁

The `associateFind` utility allows you to define one-to-many relationships on your Model functions. The `makeParams` property allows you to specify the query that defines the relationship. This example is truncated. For a full example, see the "Start a Project" pages.

```ts
import type { Users } from 'my-feathers-api'
import { type ModelInstance, useInstanceDefaults, associateFind } from 'feathers-pinia'
import { Message } from './message'

const modelFn = (data: ModelInstance<Users>) => {
  const withDefaults = useInstanceDefaults({ email: '', password: '' }, data)
  const withMessages = associateFind(withDefaults, 'messages', {
    Model: Message,
    makeParams: (data) => ({ query: { userId: data.id } }),
    handleSetInstance(message) {
      message.userId = data.id
    },
  })
  return withMessages
}
```

The `handleSetInstance` function allows you to write data to the `messages` property and make sure each record becomes
properly associated.

Read more about [associateFind](/guide/associate-find)

### `associateGet` 🎁

The `associateGet` utility allows you to define `one-to-one` relationships on your Model functions. The `getId` property
allows you to specify the id to use to get the related data.

```ts
import type { Messages } from 'my-feathers-api'
import { type ModelInstance, useInstanceDefaults, associateGet } from 'feathers-pinia'
import { User } from './user'

const modelFn = (data: ModelInstance<Messages>) => {
  const withDefaults = useInstanceDefaults({ text: '', userId: null }, data)
  const withUser = associateGet(withDefaults, 'user', {
    Model: User,
    getId: (data) => data.messageId
  })
  return withUser
}
```

Read more about [associateGet](/guide/associate-get)

## New `useFind` API 🎁

The `useFind` API has been completely rewritten from scratch. A couple of its best features include

- **Intelligent Fall-Through Caching** - Like SWR, but way smarter.
- **Pagination Support** - Built in, sharing the same logic with `usePagination`.

See all of the features on the [`useFind` page](./use-find).

See the component example of server-side pagination on the [`useFind` page](./use-find).

## `useFindWatched` API ⚠️

To make migration to the new `useFind` API easier, the old `useFind` API has been renamed and is now called [`useFindWatched`](./use-find-watched.md).

Learn more about the old API on the [`useFindWatched` page](./use-find-watched.md).

See the new API on the [`useFind` page](./use-find.md).

## Store API Improvements

The `useFind` utility -- for implementing fall-through-cached `find` requests -- is now available directly on the store, further reducing boilerplate.

### `store.useFind` ➕

With the old way, you have to import `useFind` and provide the model to it from the instantiated store.

```ts
import { useFind } from 'feathers-pinia'
import { useTutorials } from '../store/tutorials'

const tutorialStore = useTutorials()
const tutorialsParams = computed(() => {
  return { query: {}, }
})
const { items: tutorials } = useFind({ model: tutorialStore.Model, params: tutorialsParams })
```

In the new way, there's no need to import useFind. Call it as a method on the store and don't pass `model`

```ts
import { useTutorials } from '../store/tutorials'

const tutorialStore = useTutorials()
const tutorialsParams = computed(() => {
  return { query: {}, }
})
const { items: tutorials } = tutorialStore.useFind({ params: tutorialsParams })
```

Think of all of the extra time you'll have instead of having to write those 1.5 lines of code over and over again! 😁

### `store.useGet` ➕

The `useGet` utility -- for implementing fall-through-cached `get` requests -- is now available directly on the store,
further reducing boilerplate.

## Smaller Package Size 🎉

When it comes to npm bundles, smaller package size is a good thing.

### Optimized Vite Build 💪

The overall bundle size has been reduced from around 20kb to 12kb, gzipped.  This was done through

- Replacing hefty dependencies, like lodash's debounce, with smaller equivalents, like [just-debounce](https://npmjs.com/package/just-debounce).
- Optimizing the Vite build to externalize modules.

Here is the previous output from `npx vite-bundle-visualizer` to compare.  All of the modules highlighted, below, were
able to be removed from the package, resulting in a much leaner build:

![Optimized Vite Build](https://user-images.githubusercontent.com/128857/189497860-ea0b5b39-7484-416b-b411-748994e2fc33.png)

### LZW Storage is Out ➖

Prior to this version, Feathers-Pinia included a localStorage plugin that used LZW compression. It came with the benefit
of doubling the amount of data you could put in storage. The downside was that it made the bundle size big, so we
removed it.  It will be published as an independent package at a later date.

Our LocalStorage adapter remains part of the package and is so fast that it makes Single Page Apps feel like they're
doing Server Side Rendering.  If you haven't tried it, yet, it's easy to setup and it's worth it!

## No More `defineAuthStore`

The <a href="#useauth-🎁">useAuth</a> utility takes the place of `defineAuthStore`.

See how to [migrate from defineAuthStore to useAuth](/guide/migrate-from-v0#no-more-defineauthstore)
