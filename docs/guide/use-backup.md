---
outline: deep
---
<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# useBackup

[[toc]]

The new `useBackup` utility is the opposite of working with clones. Instead of binding your form to a clone, you use the original record. It keeps a copy, letting you call `backup` or `restore` to revert changes. The `save` method auto-diffs from the backup, keeping data size to a minimum.  

## API

The `useBackup` utility must receive a ComputedRef.  It uses the computed value to automatically

```ts
const backup = useBackup(data, { idField: '_id' })
```

Where backup is an object containing the following properties:

- `data` - the reactive data
- `backup` - a copy of the data
- `restore` - a method to restore the data to the backup.
- `save` - a method to save the data, sending only the diff

## Example

Here's an example:

```vue
<script setup lang="ts">
import { useBackup } from 'feathers-pinia'

import type { User } from '~/services/users' // wherever your User type is

const props = defineProps<{
  user: User
}>()

const userBackup = useBackup(computed(() => props.user))
const { data: user } = userBackup

// save only sends the diff
async function save() {
  await userBackup.save()
}
</script>

<template>
  <form @submit.prevent="save">
    <input v-model="user.name">

    <button @click="userBackup.restore()">
      Restore
    </button>

    <button type="submit">
      Save
    </button>
  </form>
</template>
```