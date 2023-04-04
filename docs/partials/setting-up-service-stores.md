We're now ready to create a store for each Model. We'll create a `users` store for the `User` Model and a `tasks` store
for the `Task` Model.

### 5.1 Users Store

Unlike previous versions of Feathers-Pinia, version 2.0 lets you use native Pinia functions to build
[`setup` stores](https://pinia.vuejs.org/core-concepts/#setup-stores). The original "Options stores" are not supported
since they involve more cognitive overhead and are more difficult to keep organized.

Use the code below to create the `useUserStore` composable in the `stores` folder.

```ts
// stores/service.users.ts
import { defineStore } from 'pinia'

export const useUserStore = () => {
  const { pinia, idField, whitelist, servicePath, service, name } = useUsersConfig()

  const useStore = defineStore(servicePath, () => {
    const utils = useService({ service, idField, whitelist })
    return { ...utils, test: true }
  })
  const store = useStore(pinia)

  connectModel(name, useUserModel, () => store)

  return store
}
```

Notice that we're reusing the `useUsersConfig` composable as an auto-import. Other auto-imports in use are `useService`
and `connectModel`. The `useService` utility returns the default values that are required for a Feathers-Pinia store.
These stores are [fully customizable](/guide/use-service#customize-the-store). The `connectModel` utility wires up the
`User` Model with the `users` store.

### 5.2 Tasks Store

Now let's create a `tasks` store and connect it to the `Task` Model.

```ts
// stores/service.tasks.ts
import { defineStore } from 'pinia'
import { useService } from 'feathers-pinia'

export const useTaskStore = () => {
  const { pinia, idField, whitelist, servicePath, service, name } = useTasksConfig()

  const useStore = defineStore(servicePath, () => {
    const utils = useService({ service, idField, whitelist })
    return { ...utils }
  })
  const store = useStore(pinia)

  connectModel(name, useTaskModel, () => store)

  return store
}
```

Since we wrapped our stores in utility functions, we can use them with auto-import just like any utility in `composables`:

```vue
<script setup lang="ts">
const userStore = useUserStore()
const taskStore = useTaskStore()
</script>
```

With the above files in place, we're ready to start using stores in components!

### 5.3. Using Stores

Here's a basic component showing how to reference a store and start creating:

```vue
<script setup lang="ts">
const User = useUsers()

// Find users with fall-through cache
const { users } = User.useFind({ query: {}, onServer: true })

// Create a user and add to the store
const user = User({ email: 'foo', _id: 'bar' }).addToStore()
</script>

<template>
  <div>
    <h1>Home</h1>

    <p>{{ user }}</p>
    
    <!-- List of users returned by userStore.useFind() -->
    <ul>
      <li v-for="user in users" :key="user._id">{{ user.name }}</li>
    </ul>
  </div>
</template>
```
