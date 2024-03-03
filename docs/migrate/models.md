---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Migrate Models to Services

[[toc]]

Model Classes and Functions have served us well, but are no more. Every Feathers Service now includes implicit model
functions which can be extended.

## Why Implicit Models?

Rather than having to setup every single model, we can take advantage of Vue 3's `reactive` API, which allows one to
dynamically add and remove attributes from reactive objects. Feathers-Pinia 3 takes full advantage of this fact and
automatically assumes that every object needs to be a model. So now there is no need to manually create them.

## Switch to Implicit Modeling

The below tabs allow you to compare previous modeling examples to the latest API. In Feathers-Pinia modeling happens in
the `services` config of `createPiniaClient`.

::: code-group

```ts [Old Model Class]
// models/user.ts
import { BaseModel } from '../store/store.pinia'

export class User extends BaseModel {
  /* You might have defined default values, here, */
  _id?: string
  name = ''
  email = ''
  password = ''

  // Depending on the Feathers-Pinia version, you may not have written a constructor
  constructor(data: Partial<User> = {}, options: Record<string, any> = {}) {
    super(data, options)
    this.init(data)
  }

  // optional for setting up data objects and/or associations
  static setupInstance(message: Partial<Task>) {
    const { store, models } = this
    return {
      /* default properties used to go here */
    }
  }
}
```

```ts [Old Model Fn]
import type { Users, UsersData, UsersQuery } from 'my-feathers-api'
import { type ModelInstance, useFeathersModel, useInstanceDefaults } from 'feathers-pinia'
import { api } from '../feathers'

const service = api.service('users')

function modelFn(data: ModelInstance<Users>) {
  const withDefaults = useInstanceDefaults({ name: '', email: '', password: '' }, data)
  return withDefaults
}
const User = useFeathersModel<Users, UsersData, UsersQuery, typeof modelFn>(
  { name: 'User', idField: '_id', service },
  modelFn,
)
```

```ts [New API]
import { createPiniaClient, useInstanceDefaults } from 'feathers-pinia'
import type { ServiceInstance } from 'feathers-pinia'
import type { Users } from 'my-feathers-api'

const api = createPiniaClient(feathersClient, {
  pinia,
  idField: 'id',
  services: {
    users: {
      setupInstance(data: ServiceInstance<Users>) {
        const withDefaults = useInstanceDefaults({ name: '', email: '', password: '' }, data)
        return withDefaults
      },
    },
  },
})
```

:::

## Important Changes

### No Model Constructors

The Model constructor is now the model function. If you have any constructor logic, move it into the `setupInstance`
method of the service's configuration.

### `useInstanceDefaults`

The `instanceDefaults` static Model function is replaced by the [useInstanceDefaults utility](/guide/use-instance-defaults).

### `setupInstance` Changes

You must return the object from the `setupInstance` function. If not, you'll run into errors.
