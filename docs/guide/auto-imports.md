---
outline: deep
---
<script setup>
import Badge from '../components/Badge.vue'

import BlockQuote from '../components/BlockQuote.vue'
</script>

# Auto-Imports

[[toc]]

Auto-Imports are amazing!. 🎉 They keep code clean and decoupled. As an added bonus, you no longer have to manually
import modules at the top of every file. Feathers-Pinia comes with auto-import modules targeted at improving developer
experience.

This page shows how to set up auto-imports for Single Page Apps, followed by an overview of the available
auto-imports. The [Nuxt module](/guide/nuxt-module) documentation shows how to install Nuxt SSR-friendly versions of
these same utilities.

## Preset for `unplugin-auto-import`

Feathers-Pinia v2 includes an auto-import preset for `unplugin-auto-import`, a plugin which works for Vite, Rollup,
Webpack, Quasar, and more. [See setup instructions for your environment](https://github.com/antfu/unplugin-auto-import).

Once you've installed `unplugin-auto-import`, you can use the `feathersPiniaAutoImport` preset in it's configuration.
Import the preset from `feathers-pinia` and pass it in the `imports` array option. Here is a truncated example of a
`vite.config.ts` file:

```ts{4,22}
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { feathersPiniaAutoImport } from 'feathers-pinia'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    Vue({
      reactivityTransform: true,
    }),

    // https://github.com/antfu/unplugin-auto-import
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        'vue-i18n',
        'vue/macros',
        '@vueuse/head',
        '@vueuse/core',
        feathersPiniaAutoImport,
      ],
      dts: 'src/auto-imports.d.ts',
      dirs: ['src/composables', 'src/models', 'src/stores'],
      vueTemplate: true,
    }),
  ],
})
```

The `dirs` option, shown above, is important to enable the `composables`, `models`, and `stores` folders to all work
with auto-imports. Now we can keep our code organized by purpose, as is shown in the [Setup Guides](/guide/get-started).

All of the [Model Composition Utilities](#model-composition-utilities) and [Feathers-Pinia Composables](#feathers-pinia-composables)
on this page are made available through auto-imports.

<BlockQuote>
You have to start (and sometimes restart) the dev server for the auto-imports to become available.
</BlockQuote>

## Module for Nuxt Auto-Imports

By using the [Nuxt Module](/guide/nuxt-module) in your project, the utilities on this page will become auto-importable.
The `useModel`, `connectModel` and `onModelReady` utilities provided by `nuxt-feathers-pinia` are ready for Server-Side
Rendering, Static Site Generation, and Hybrid Rendering. They have the exact same API as the same methods from the
`feathers-pinia` package.

## Available Auto-Imports

### Model Composition Utilities

These composables help keep your code organized. They use a global state object, works well for Single Page Apps. The
[Nuxt Module](/guide/nuxt-module) supports SSR. Other environments will require some research and integration.

These are all available as auto-imports:

- [useModel](#usemodel)
- [connectModel](#connectmodel)
- [onModelReady](#onmodelready)

#### useModel

**`useModel(name, modelWrapperFn)`**

- **`name {string}`** the name of the Model function. Must be unique to avoid overwriting other stored Models.
- **`modelWrapperFn {Function}`** a function that returns a Model function.

Writing composables can be especially tricky when you need to persist state. The `useModel` composable wraps around your
Model Function creation to assure it never gets overwritten or re-created every time you call its composable function.

<!--@include: ./notification-feathers-client.md-->

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

In the example, above, calling `useTaskModel` the first time would create the Model function and store it internally.
Calling `useTaskModel` additional times will only reference the stored Model.

#### connectModel

**`connectModel(name, getModel, getStore)`**

- **`name {string}`** the name of the Model function.
- **`getModel {Function}`** a function that returns the Model.
- **`getStore {Function}`** a function that returns the store.

The `connectModel` utility allows us to better organize our code by allowing the Model and store to be independent. For
example, we can keep the Model in the `models` folder and the store in the `stores` folder. It also allows us to take
full advantage of Pinia's excellent TypeScript support for stores.

The following code tabs show how to link a Model and store together using `connectModel`. Note that we called the store
filename `service.tasks.ts` to differentiate it from other non-service stores.

<!--@include: ./notification-feathers-client.md-->

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
    return { ...utils }
  })
  const store = useStore($pinia)

  // Connect the store to the Model. Name must match the other file.
  connectModel('Task', useTaskModel, () => store)

  return store
}
```

:::

<!--@include: ./store-notification-feathers-client.md-->

The `connectModel` utility also utilitizes the internal model storage, so the `name` attribute must match in both the
Model and store files. The `name` must be unique to avoid overwriting other Models.

#### onModelReady

**`onModelReady(name, callbackFn)`**

- **`name {string}`** the name of the Model
- **`callbackFn {Function}`** the function to call after the Model and store are properly connected.

There are times when you only want to run some code after the Model and store are connected. For example, you only want
to register the [hooks](/guide/hooks) a single time, not every time the use calls the composable. By wrapping this logic
inside the `onModelReady` callback function, you can achieve that result

<!--@include: ./notification-feathers-client.md-->

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

### Feathers-Pinia Composables

In addition to the [Model Composition Utilities](#model-composition-utilities), above, the following Feathers-Pinia
composables are available as auto-imports.

#### Data Modeling

- [useFeathersModel](/guide/use-feathers-model) for creating Feathers-connected Model functions.
- [useBaseModel](/guide/use-base-model) for creating Model functions that only store data locally and do not connect to
an API server.
- [useInstanceDefaults](/guide/model-functions-shared#useinstancedefaults) for creating default Model instance values.
- [useFeathersInstance](/guide/model-functions-shared#usefeathersinstance) for upgrading [BaseModel Instances](/guide/use-base-model-instances)
to be full [FeathersModel Instances](/guide/use-feathers-model-instances).

#### Relationship Modeling

- [associateGet](/guide/associate-get) for creating one-to-one associations
- [associateFind](/guide/associate-find) for creating one-to-many associations

#### Store Creation

- [useService](/guide/use-service) for creating service stores.
- [useAuth](/guide/use-auth) for creating auth stores.

#### Data Fetching

- [useFind](/guide/use-find) for fall-through cache-enabled `find` queries.
- [useGet](/guide/use-get) for cache-enabled `get` queries.

#### Form Building

- [useClone](/guide/use-clone) for simplifying clone and commit for a single component prop.
- [useClones](/guide/use-clones) for simplifying clone and commit for all of a component's props.

#### Hook Registration

- [feathersPiniaHooks](/guide/hooks) for registering required hooks.
