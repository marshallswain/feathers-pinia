---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Migrate `handleClones` to `useClones`

[[toc]]

In Feathers-Pinia 2.0 the `handleClones` API has been renamed to `useClones` and features a simplified API.

## API Change

One of the main features of `useClones` was the automated diffing that happened in the `save_handlers`. In 1.x, that
functionality is built directly into `instance.patch()` (and `instance.save()` when it calls patch). Having automatic
diffing built into the Model instance API dramatically simplified `useClones`.  Here is a set of before and after code
examples:

::: code-group

```vue [handleClones (old)]
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
import { handleClones } from 'feathers-pinia'

const props = defineProps({
  user: { type: Object },
})

const { clones, saveHandlers } = handleClones(props)
const { save_user } = saveHandlers
</script>
```

```vue [useClones (new)]
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

:::

The new API returns the clones at the top level of the returned object. It also removes the `saveHandlers`, since those are built into the cloned instance.

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

## Behavior Change

Previously, `useClones` would deep-watch the cloned props, by default. This was great if you wanted your forms to update in realtime, but also had the unfortunate effect of sometimes overwriting values currently being edited in highly-used apps. To address this potential UX bug, clone values only update shallowly, when `id` value of the instance prop changes.  To replicate previous functionality, you can watch the original instance in the store, and manually update the clone.

## save_handlers Removed

The `save_handlers` are no longer required because their functionality has been integrated directly into the core of
Feathers-Pinia. Feathers-Pinia now auto-detects when you're calling `.save()` on a clone and automatically performs
patch diffing! All of the same features are available by passing `params` api.

See the patch diffing section of the [FeathersModel Instance docs](use-feathers-model-instances#patch-diffing)

## `saveWith` Removed

If you were using the `saveWith` option of the `saveHandlers`, they will need to be replaced by the [`with` option](./whats-new#always-save-certain-props) when calling `instance.save()` or `instance.patch()`.

Read more about the `with` option, [here](./whats-new#always-save-certain-props).

See the patch diffing section of the [FeathersModel Instance docs](use-feathers-model-instances#patch-diffing)
