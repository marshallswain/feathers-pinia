---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import pkg from '../../package.json'
import BlockQuote from '../components/BlockQuote.vue'
</script>

<div style="position: fixed; z-index: 1000; top: 2px; right: 2px;">
  <Badge :label="`v${pkg.version}`" />
</div>

# useClone

[[toc]]

The `useClone` utility makes working with form data easier. It provides the following features in a fairly smart way:

- Simple access to [automatic patch diffing](/guide/use-feathers-model-instances.html#patch-diffing) for `patch`
requests. Only send the data to the server that has actually changed.
- The [clone and commit pattern](/guide/common-patterns#clone-and-commit-pattern) runs under the hood, keeping the
number of store actions to a minimum.
- Eager UI Updates: the UI updates immediately and assumes requests will be successful. Any failures are rolled back.

<BlockQuote label="FeathersModel Required">

It currently only works with [FeathersModel instances](/guide/use-feathers-model-instances) because it depends on the
`.save()` and `.patch()` instance methods.

</BlockQuote>

## Basic Example

Here's an example form that uses `useClone` on a `user` prop.

```vue
<template>
  <form @submit.prevent="() => clone.save()">
    <input
      v-model="clones.name"
      type="text"
      placeholder="Enter the User's Name"
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
})

const clone = useClone(props, 'user')
</script>
```

## API

**`useClone(props, propName, options)`**

- **`props {Object}`** a component's `props` object (or a `reactive` with model instances at the top level). **Required**
- **`propName {String}`** the name of the prop to watch for incoming Model instances. **Required**
- **`options {Object}`** an options object
  - **`useExisting {boolean}`** when `true` tells `useClone` to reuse any existing clone. This is handy for handling
  two instances of `useClone` at the same time on the record. Default: `false`.
  - **`deep {boolean}`** when `true`, tells `useClone` to re-clone any time the original record changes.

The value returned from `useClone` will change based on the value of `props[propName]`:

- If the prop holds a Model instance, it returns the cloned instance.
- If the prop does not hold a Model instance, it returns `null`.

Note that the `clone` object in the previous example is a `ref`, so you access it with `.value` outside the template.

## Diffing Data for Patch

Patch diffing is now built into the core of Feathers-Pinia. The `.save()` method of every cloned FeathersModel instance
will perform diffing for you.

See the [Automatic Patch Diffing API](/guide/use-feathers-model-instances.html#patch-diffing).
