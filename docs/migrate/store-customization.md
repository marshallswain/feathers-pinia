---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'

import BlockQuote from '../components/BlockQuote.vue'
</script>

# Composing Stores

Instead of customizing stores, a more flexible solution is provided by Pinia: Store Composition. Here's an example of
how to create a feature store that references a Feathers-Pinia v3 store.

```ts
export const useFeatureStore = defineStore('my-feature-store', () => {
  const { api } = useFeathers()

  const usersNamedFred = computed(() => {
    return api.service('users').findInStore({ query: { name: 'Fred' } }).data.value
  })
  
  return { usersNamedFred }
})
```

You can use any of the Feathers-Pinia service methods in composed stores. Read more about [Pinia Store Composition](https://pinia.vuejs.org/cookbook/composing-stores.html)
