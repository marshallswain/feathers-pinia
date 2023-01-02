---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Nuxt Module

[[toc]]

Feathers-Pinia v2 comes with a Nuxt Module, which currently works with [Nuxt 3](https://nuxt.com). It provides two main
features:

- A set of composables for working with Feathers-Pinia and Nuxt.
- Auto-import configuration for key Feathers-Pinia composables.

<BlockQuote>

Working with Nuxt requires the use of Pinia stores.

</BlockQuote>

## Installation

The Nuxt module has [its own package](https://npmjs.com/package/nuxt-feathers-pinia) to install alongside
`feathers-pinia`:

```bash
npm i nuxt-feathers-pinia
```

Once installed, add its name to the `nuxt.config.ts` file. It's also recommended that you add the `imports`
configuration, shown below, to allow you to keep `models` and `stores` in their own folder, since they are different
than other composables. Apart from keeping your project well organized, this also enables auto-imports in those folders.

```ts
// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
    'nuxt-feathers-pinia',
  ],
  // Allows you to put stores and models in their own folders
  imports: {
    dirs: [
      'stores',
      'models',
    ],
  },
  // Enable Nuxt Takeover Mode: https://nuxt.com/docs/getting-started/installation#prerequisites
  typescript: {
    shim: false,
  },
  // optional: https://vuejs.org/guide/extras/reactivity-transform.html
  experimental: {
    reactivityTransform: true,
  },
})
```

When you start the dev server, all of the composables described on this page will become auto-importable.

## Nuxt Composables

### useModel

**`useModel(name, modelWrapperFn)`**

- **`name {string}`** the name of the Model function. Must be unique to avoid overwriting other stored Models.
- **`modelWrapperFn {Function}`** a function that returns a Model function.

Writing composables can be especially tricky when you need to persist state. The `useModel` composable wraps around your
Model Function creation to assure it never gets overwritten or re-created every time you call its composable function.

<!--@include: ./types-notification.md-->

```ts
import { type ModelInstance } from 'feathers-pinia'
import type { Tasks, TasksData, TasksQuery } from 'feathers-pinia-api'

/**
 * Wrapping creation of Models in `useModel` makes sure the Model only 
 * gets created once, even if you call `useTaskModel` from multiple 
 * locations in your app.
 */
export const useTaskModel = () => {
  const Model = useModel('Task', () => {
    const modelFn = (data: ModelInstance<Tasks>) => {
      const defaults = {
        description: '',
        isComplete: false,
      }
      const withDefaults = useInstanceDefaults(defaults, data)
      return withDefaults
    }
    return useFeathersModel<Tasks, TasksData, TasksQuery, typeof modelFn>(
      { name: 'Task', idField: '_id', serviceuseFeathersService<Tasks, TasksQuery>('tasks') },
      modelFn,
    )
  })
  return Model
}
```

When you register the `nuxt-feathers-pinia` module on your app, it creates an object called `$fp` on the NuxtApp object
on every request. This means the NuxtApp is a safe place to use for per-request app state, which is perfect for
Server-Side Rendering (SSR) and Static Site Generation (SSG).

In the example, above, calling `useTaskModel` the first time would create the Model function and store it in the `$fp`
object. Calling `useTaskModel` additional times will only reference the model from its stored location.

### connectModel

**`connectModel(name, getModel, getStore)`**

- **`name {string}`** the name of the Model function.
- **`getModel {Function}`** a function that returns the Model.
- **`getStore {Function}`** a function that returns the store.

The `connectModel` utility allows us to better organize our code by allowing the Model and store to be independent. For
example, we can keep the Model in the `models` folder and the store in the `stores` folder. It also allows us to take
full advantage of Pinia's excellent TypeScript support.

The following code tabs show how to link a Model and store together using `connectModel`. Note that we called the store
filename `service.tasks.ts` to differentiate it from other non-service stores.

<!--@include: ./types-notification.md-->

::: code-group

```ts [models/task.ts]
import { type ModelInstance } from 'feathers-pinia'
import type { Tasks, TasksData, TasksQuery } from 'feathers-pinia-api'

/**
 * After creating a Model, we can connect it to the store
 * by using the `connectModel` function.
 */
export const useTaskModel = () => {
  const Model = useModel('Task', () => {
    const modelFn = (data: ModelInstance<Tasks>) => {
      const defaults = {
        description: '',
        isComplete: false,
      }
      const withDefaults = useInstanceDefaults(defaults, data)
      return withDefaults
    }
    return useFeathersModel<Tasks, TasksData, TasksQuery, typeof modelFn>(
      { name: 'Task', idField: '_id', service: useFeathersService<Tasks, TasksQuery>('tasks') },
      modelFn,
    )
  })
  // Connect the Model to the store.
  connectModel('Task', () => Model, useTaskStore)

  return Model
}
```

```ts [stores/service.tasks.ts]
import { defineStore } from 'pinia'
import { useService } from 'feathers-pinia'
import type { Tasks, TasksData, TasksQuery } from 'feathers-pinia-api'

/**
 * After creating a store, we can connect it to the Model
 * by using the `connectModel` function.
 */
export const useTaskStore = () => {
  const { $pinia } = useNuxt()

  const useStore = defineStore(servicePath, () => {
    const utils = useService({ 
      idField: '_id', 
      service: useFeathersService<Tasks, TasksQuery>('tasks') 
    })
    return { ...utils, customAttribute: true }
  })
  const store = useStore($pinia)

  // Connect the store to the Model. Name must match the other file.
  connectModel('Task', useTaskModel, () => store)

  return store
}
```

:::

<!--@include: ./store-types-notification.md-->

The `connectModel` utility also utilitizes the `$fp` object in the NuxtApp request instance, so the `name` attribute
must match in both files and must be unique to avoid overwriting other models.

### onModelReady

**`onModelReady(name, callbackFn)`**

- **`name {string}`** the name of the Model
- **`callbackFn {Function}`** the function to call after the Model and store are properly connected.

There are times when you only want to run some code after the Model and store are connected. For example, you only want
to register the [hooks](/guide/hooks) a single time, not every time the use calls the composable. By wrapping this logic
inside the `onModelReady` callback function, you can achieve that result

<!--@include: ./types-notification.md-->

```ts
import { type ModelInstance } from 'feathers-pinia'
import type { Tasks, TasksData, TasksQuery } from 'feathers-pinia-api'

/**
 * After connecting the Model to the store we can run logic once
 * by using the `onModelReady` function.
 */
export const useTaskModel = () => {
  const service = useFeathersService<Tasks, TasksQuery>('tasks')
  const Model = useModel('Task', () => {
    const modelFn = (data: ModelInstance<Tasks>) => {
      const defaults = {
        description: '',
        isComplete: false,
      }
      const withDefaults = useInstanceDefaults(defaults, data)
      return withDefaults
    }
    return useFeathersModel<Tasks, TasksData, TasksQuery, typeof modelFn>(
      { name: 'Task', idField: '_id', service },
      modelFn,
    )
  })

  connectModel('Task', () => Model, useTaskStore)
  onModelReady('Task', () => {
    service.hooks({ around: { all: [...feathersPiniaHooks(Model)] } })
  })

  return Model
}
```

Note that the execution order of `onModelReady` and `connectModel` does not matter. Either way, once the model and store
are connected, the hooks will be registered a single time, allowing them to connect properly to the Model and store.

## Feathers-Pinia Composables

In addition to the Nuxt utilities, above, this module also makes the following Feathers-Pinia composables are available
as auto-imports. You no longer have to manually import them at the top of each file.

### Data Modeling

- [useFeathersModel](/guide/use-feathers-model) for creating Feathers-connected Model functions.
- [useBaseModel](/guide/use-base-model) for creating Model functions that only store data locally and do not connect to
an API server.
- [useInstanceDefaults](/guide/model-functions-shared#useinstancedefaults) for creating default Model instance values.
- [useFeathersInstance](/guide/model-functions-shared#usefeathersinstance) for upgrading [BaseModel Instances](/guide/use-base-model-instances)
to be full [FeathersModel Instances](/guide/use-feathers-model-instances).

### Relationship Modeling

- [associateGet](/guide/associate-get) for creating one-to-one associations
- [associateFind](/guide/associate-find) for creating one-to-many associations

### Store Creation

- [useService](/guide/use-service) for creating service stores.
- [useAuth](/guide/use-auth) for creating auth stores.

### Data Fetching

- [useFind](/guide/use-find) for fall-through cache-enabled `find` queries.
- [useGet](/guide/use-get) for cache-enabled `get` queries.

### Form Building

- [useClone](/guide/use-clone) for simplifying clone and commit for a single component prop.
- [useClones](/guide/use-clones) for simplifying clone and commit for all of a component's props.

### Hook Registration

- [feathersPiniaHooks](/guide/hooks) for registering required hooks.
