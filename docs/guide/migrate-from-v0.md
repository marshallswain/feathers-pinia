---
outline: deep
---

# Migration from Feathers-Pinia v0.x

> 🚧 Since version 1.0 is in Pre-release, this page is a work in progress. If you see something that needs more clarity, please open an issue. 🚧

<script setup>
import BlockQuote from '../components/BlockQuote.vue'
</script>

<BlockQuote type="danger" label="🚧 CAUTION 🚧">

If you're going to try out the pre-release, make sure you **lock the version number** in your package.json.

</BlockQuote>

Once you've installed version 1.0 (currently with `npm i feathers-pinia@pre`) you'll need to make the following changes.

## Model Constructors Required

All of your Model classes now require a custom constructor. If you've already been using custom constructors and have been manually calling `instanceDefaults` and `setupInstance`, you can simplify it by replacing those lines with `this.init(data)`, as shown here:

```ts
// Minimum required constructor
constructor(data: Partial<Message> = {}, options: Record<string, any> = {}) {
  super(data, options)
  this.init(data)
}
```

The above example types `data` as `Partial<Message>` to allow you to initialize partial models and let the default values kick in.

## Optional `instanceDefaults`

The `instanceDefaults` static Model function is now optional. You have a couple of options on what to do here:

- **Do nothing**, and `instanceDefaults` will continue to work. If you assign default values conditionally, you'll want to stick with `instanceDefaults`.
- **Use the Model Interface**: If your default values are not assigned conditionally, you can move them into the Model interface, as is done with `text`, `userId`, and `createdAt` in this example:

  ```ts
  export class Message extends BaseModel {
    _id: number
    text = ''
    userId: null | number = null
    createdAt: Date | null = null

    constructor(data: Partial<Message> = {}, options: Record<string, any> = {}) {
      super(data, options)
      this.init(data)
    }

    static setupInstance(message: Partial<Message>) {
      const { store, models } = this
      
    }
  }
  ```

## Use `instanceDefaults` Correctly

If you are using `instanceDefaults` for anything other than simply initializing default values, refactor and move any complex functionality to `setupInstance`.  The `setupInstance` function runs twice since it is stilled declared on BaseModel. The `setupInstance` function has been removed from BaseModel and only runs once.

If you are cloning large amounts of default data inside of `instanceDefaults`, consider moving only that part into setupInstance, as well, so it won't be run twice.

## `useClones` API Change

One of the main features of `useClones` was the automated diffing that happened in the `save_handlers`. In 1.x, that functionality is built directly into `Model.patch()` (and `Model.save()` when it calls patch). Having automatic diffing built into the Model instance API dramatically simplified `useClones`.  Here is a set of before and after code examples:

The Old Way:

```vue
<template>
  <div>
    <input
      v-model="clones.user.name"
      type="text"
      placeholder="Enter the User's Name"
      @keyup.enter="() => save_user()"
    >
    <button @click="() => save_user()">
      Save
    </button>
  </div>
</template>

<script setup lang="ts">
import { useClones } from 'feathers-pinia'

const props = defineProps({
  user: { type: Object },
})

const { clones, saveHandlers } = useClones(props)
const { save_user } = saveHandlers
</script>
```

The new API returns the clones at the top level of the returned object. It also removes the `saveHandlers`, since those are built into the cloned instance.

```vue
<template>
  <div>
    <input
      v-model="clones.user.name"
      type="text"
      placeholder="Enter the User's Name"
      @keyup.enter="() => clones.user.save()"
    >
    <button @click="() => clones.user.save()">
      Save
    </button>
  </div>
</template>

<script setup lang="ts">
import { useClones } from 'feathers-pinia'

const props = defineProps({
  user: { type: Object },
})

const clones = useClones(props)
</script>
```

You can also destructure the clones, since each clone is a Vue Ref. If you need access to the original instance in the template, consider renaming the clone as you destructure. This next example also shows how you can put `_user.save()` into a separate function to avoid repetition in the template.

```vue
<template>
  <div>
    Previous name: {{user.name}}
    <input
      v-model="_user.name"
      type="text"
      placeholder="Enter the User's Name"
      @keyup.enter="save"
    >
    <button @click="save">
      Save
    </button>
  </div>
</template>

<script setup lang="ts">
import { useClones } from 'feathers-pinia'

const props = defineProps({
  user: { type: Object },
})

const { user: _user } = useClones(props) // destructuring and renaming `clones.user` to `_user`
const save = () => _user.save() // a save method for a cleaner template
</script>
```

Read more about built-in patch diffing, [here](./use-clones#automatic-patch-diffing).

## `useClones` Behavior Change

Previously, `useClones` would deep-watch the cloned props, by default. This was great if you wanted your forms to update in realtime, but also had the unfortunate effect of sometimes overwriting values currently being edited in highly-used apps. To address this potential UX bug, clone values only update shallowly, when `id` value of the instance prop changes.  To replicate previous functionality, you can watch the original instance in the store, and manually update the clone.

## `useClones` `saveWith` Removed

If you were using the `saveWith` option of the `saveHandlers`, they will need to be replaced by the [`with` option](/whats-new#always-save-certain-props) when calling `instance.save()` or `instance.patch()`.

Read more about the `with` option, [here](/whats-new#always-save-certain-props).

## `setupInstance` Changes

This won't affect most apps, but the first argument to `setupInstance` was previously the passed in `data`. In v1.x, the first argument is the **actual instance**, which is it's no longer required to return a value from `setupInstance`. If you were editing the `data` argument, directly, your app should just work.  If your `setupInstance` just returned a value, you'll need to manually merge it into `data`, now.

## Don't Worry About `__isClone`

There's no need to manually remove `__isClones` in hooks. It is now added as a non-enumerable value, so it won't show up during instance serializion when prepping to send to the API server.

## No `debounceEventsMaxWait`

**TLDR:** If you were using it, replace `debounceEventsMaxWait` with `debounceEventsGuarantee`.

In order to reduce file size, we have removed lodash's debounce from the package.  Lodash's debounce supported custom intervals for guaranteed execution.  The replacement package, [just-debounce](https://npmjs.com/package/just-debounce) does not support a custom interval for guarantee. You can still guarantee execution by setting `debounceEventsGuarantee: true` in the options.  This shouldn't break any apps since the guaranteed interval will only be made shorter.