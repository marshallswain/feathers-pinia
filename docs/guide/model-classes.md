# Model Classes

Each Service Store gets its own Model Class.  If you don't explicitly create it, one gets created under the hood.  There are some benefits to using them:

- Convenient access to Feathers Service methods.  Methods directly on the Model will effect the store.  You can also directly access the Feathers service at `Model.service`.  Using the Feathers Service directly allows you to bypass the store when needed.
- The Model Class API provides a common interface that abstracts away the underlying implementation.  This is similar to how FeathersJS database adapters work.  FeathersJS supports many database adapters.  By swapping out an adapter, the same code that was previously running on one database now runs on some other database.
- You can extend the common interface with custom methods, getters, and setters.

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

One caveat about working without a Model class is that you can't use the new operator.  To add an item to the store, pass an object to the `add` action.

```vue
<script setup lang="ts">
import { useUsers } from '~/store/users.pinia.ts'

const usersService = useUsers()

usersService.add({ id: 0, name: 'Marshall' })
</script>
```