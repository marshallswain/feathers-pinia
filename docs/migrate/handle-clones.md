---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'

import BlockQuote from '../components/BlockQuote.vue'
</script>

# Migrate `handleClones` to `useGet`

[[toc]]

Feathers-Pinia 3.0 no longer includes a `handleClones` (v0) or `useClones` (v2) API. You can now use `params.clones`
together with `useGet` to replace the same functionality.

## API Change

One of the main features of `useClones` was the automated diffing that happened in the `save_handlers`. Patch diffing is
now automatic when you call `instance.patch()` (and `instance.save()` when it calls patch). The following tabs show the
old ways and the new way:

::: code-group

```vue [handleClones (0.x)]
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

```vue [useClones (2.x)]
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

```vue [service.getFromStore (3.x)]
<template>
  <div>
    <input
      v-model="clone.name"
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
const { api } = useFeathers()

const props = defineProps({
  user: { type: Object },
})
const id = computed(() => props.user._id)
const clone = api.service('users').getFromStore(id, { clones: true })

function save() {
  clone.value.save()
}
</script>
```

:::

Read more about built-in patch diffing, [here](./use-clones#automatic-patch-diffing).

## Behavior Change

Previously, `useClones` would deep-watch the cloned props, by default. This was great if you wanted your forms to update
in realtime, but also had the unfortunate effect of sometimes overwriting values currently being edited in highly-used
apps. To address this potential UX bug, clone values only update shallowly, when `id` value of the instance prop changes.
To replicate previous functionality, you can watch the original instance in the store, and manually update the clone.
