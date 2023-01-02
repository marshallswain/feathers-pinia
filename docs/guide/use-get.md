---
outline: deep
---

<script setup>
import V2Block from '../components/V2Block.vue'
</script>

<V2Block />

# useGet

[[toc]]

The `useGet` Composition API utility provides the same fall-through cache functionality as `useFind`. It has a slightly simpler API, only requiring a `model` and `id` instead of the `params` object. Still, the `params` object can be used to send along additional query parameters in the request. Below is an example of how you might use the `useGet` utility.

The goal with the examples is to focus as much as possible on functionality and not boilerplate. As such, all examples use [auto-import](https://github.com/antfu/unplugin-auto-import) for Vue APIs like `computed` and `ref`. They also use Vue's `script setup` feature. Both features come preinstalled with the [Vitesse Template for Vue](https://github.com/antfu/vitesse) and the [Vitesse-Feathers-Pinia Demo](https://github.com/marshallswain/vitesse-feathers-pinia).

```html
<template>
  <div>
    <div v-if="post">{{ post.body }}</div>
    <div v-else-if="isPending">Loading</div>
    <div v-else>Post not found.</div>
  </div>
</template>

<script setup>
import { useGet } from 'feathers-pinia'
import { usePosts } from '../store/posts'

const postStore = usePosts()

const props = defineProps({
  id: { type: String, required: true },
})
// Get the post record
const { item: post, isPending } = useGet({ model: postStore.Model, id: props.id })
<script>
```

See the [Routing with useGet](#routing-with-useget) portion of the patterns section, below, to see how to hook up the above component to vue-router.

## Options

Let's look at the TypeScript interface for the `UseGetOptions`.

```ts
interface UseGetOptions {
  model: Function
  id: null | string | number | Ref<null> | Ref<string> | Ref<number>
  params?: Params | Ref<Params>
  queryWhen?: Ref<Function>
  local?: boolean
  immediate?: boolean
}
```

And here's a look at each individual property:

- `model` must be a Feathers-Pinia Model class. The Model's `get` and `getFromStore` methods are used to query data.
- `id` must be a record's unique identifier (`id` or `_id`, usually) or a ref or computed property which returns one.
  - When the `id` changes, the API will be queried for the new record (unless `queryWhen` evaluates to `false`).
  - If the `id` is `null`, no query will be made.
- `params` is a FeathersJS Params object OR a Composition API `ref` (or `computed`, since they return a `ref` instance) which returns a Params object.
  - Unlike the `useFind` utility, `useGet` does not currently have built-in debouncing.
- `queryWhen` must be a `computed` property which returns a `boolean`. It provides a logical separation for preventing API requests apart from `null` in the `id`.
- `immediate`, which is `true` by default, determines if the internal `watch` should fire immediately. Set `immediate: false` and the query will not fire immediately. It will only fire on subsequent changes to the `id` or `params`.

### Returned Attributes

```ts
interface UseGetData {
  item: Ref<any>
  servicePath: Ref<string>
  isPending: Ref<boolean>
  hasBeenRequested: Ref<boolean>
  hasLoaded: Ref<boolean>
  isLocal: Ref<boolean>
  error: Ref<Error>
  get: Function
}
```
