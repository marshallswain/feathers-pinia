# Service Stores

A bit about service stores...

## Model Class Optional

On the section on [Setup: Service Stores](./setup#service-stores), we learned how to setup a basic service store with a Model class.

In Feathers-Pinia, model classes are not required in all cases.  Model classes are especially beneficial to

- Define Relationships with other stores 🥰
- Define default data.  This is especially important if we add support for Vue 2.
- Be able to use the `new` operator.  No Model class means to `new`.

If neither of the above scenarios applies to your situation, you can shorten the service setup and remove the `Model`.

```ts
import { defineStore, BaseModel } from './store.pinia'
import { api } from '../feathers'

const servicePath = 'users'
export const useUsers = defineStore({ servicePath })

api.service(servicePath).hooks({})
```

If you don't provide a Model class, one will be created dynamically using the servicePath as the class name.  This means that you can still take advantage of instance methods!  It's pretty convenient!


### Working without a model class

One caveat about working without a Model class is that you can't use the new operator.  You can use the `add` action on data to add it to the store.

What happens when you `add` data without an id?  This is where temps come in.

```vue

<script setup lang="ts">
import { useUsers } from '~/store/users.pinia.ts'

const usersService = useUsers()

usersService.add({ name: 'Marshall' })
</script>

```