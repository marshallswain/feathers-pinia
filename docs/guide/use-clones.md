---
outline: deep
---

<script setup>
import BlockQuote from '../components/BlockQuote.vue'
</script>

# useClones

[[toc]]

The `useClones` utility is built on top of [useClone](/guide/use-clone). There's only one big difference between them:

- `useClones` watches all props and gives you an object of clone refs. The same `options` are applied to all props.
- [useClone](/guide/use-clone) gives you back a single clone ref. It lets you give unique options per prop.

`useClones` gives you all of the same benefits as those provided by [useClone](/guide/use-clone).

<BlockQuote label="FeathersModel Required">

It currently only works with [FeathersModel instances](/guide/use-feathers-model-instances) because it depends on the
`.save()` and `.patch()` instance methods.

</BlockQuote>

## Basic Example

Here's an example form that uses `useClone` a component's props. This is a contrived example to demonstrate the API.

```vue
<template>
  <form @submit.prevent="saveAll">
    <input
      v-model="clones.user.name"
      type="text"
      placeholder="Enter the User's Name"
    >
    <input
      v-model="clones.message.text"
      type="text"
      placeholder="Enter the Message Text"
    >
    <button type="submit">
      Save
    </button>
  </form>
</template>

<script setup lang="ts">
import { useClone } from 'feathers-pinia'

const props = defineProps({
  user: { type: Object },
  message: { type: Object },
})

const clones = useClones(props)
const saveAll = () => {
  clones.user.value?.save()
  clones.message.value?.save()
}
</script>
```

## API

**`useClones(props, options)`**

- **`props {Object}`** a component's `props` object (or a `reactive` with model instances at the top level). **Required**
- **`options {Object}`** an options object
  - **`useExisting {boolean}`** when `true` tells `useClone` to reuse any existing clone. This is handy for handling
  two instances of `useClone` at the same time on the record. Default: `false`.
  - **`deep {boolean}`** when `true`, tells `useClone` to re-clone any time the original record changes.

The value returned from `useClone` will always be a `clones` object. The value of each key will change based on the
value of `props[propName]`:

- If the prop key holds a Model instance, the `clones` key will be a cloned instance.
- If the prop key does not hold a Model instance, the `clones` key will be `null`.

Note that the `clones` object in the previous example is an object of `ref`s, so you access the avlue of each key with
`.value` outside the template.

## Diffing Data for Patch

Patch diffing is now built into the core of Feathers-Pinia. The `.save()` method of every cloned FeathersModel instance
will perform diffing for you.

See the [Automatic Patch Diffing API](/guide/use-feathers-model-instances.html#patch-diffing).

## Formerly called `handleClones`

The `useClones` utility was formerly known as `handleClones` and had a very different API. See the
[Migrate handleClones page](/guide/migrate-handle-clones) for more information.
