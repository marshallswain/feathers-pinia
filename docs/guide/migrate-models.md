---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Migrate to Model Functions

[[toc]]

Model Classes have served us well, but are no more.

## Why Switch?

Switching to Model Functions provides a number of benefits:

- You get the latest features of Feathers-Pinia
  - Cleaner, modular architecture
  - Smaller bundle size
  - Fast. Very Fast
- Reduces lines of code
- Dramatically improves IDE tooling support, like Intellisense
- Adds support for FeathersJS v5 Dove.
- Includes better integration with TypeScript, almost eliminating the need to do manual typing.
- Maybe most important of all, continued support from the creator of Feathers-Vuex and Feathers-Pinia. 😁 Model Classes
are more difficult to maintain than Model Functions.

## Switch to Model Functions

Feathers-Pinia no longer depends on JavaScript/TypeScript classes and instead uses a clean, functional API. Each of your
BaseModel classes will need to be converted to a [FeathersModel](/guide/use-feathers-model) function.

<BlockQuote label="note" type="info">

Note that the concept of BaseModel has changed, FeathersModel has all of the features of the previous BaseModel class.
The new [BaseModel](/guide/use-base-model) has a core set of features for working with any type of data, FeathersJS
connectivity is optional.

</BlockQuote>

<!--@include: ./types-notification.md-->

Notice how much cleaner and more concise the new Model Functions than the old Model Classes! The separate places for
defining defaults and setting up instance data have all been combined into a single function.

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

  static setupInstance(message: Partial<Task>) {
    const { store, models } = this
    return { 
      /* default properties used to go here */
    }  
  }

  static setupInstance(data: Partial<User>) {
    // optional for setting up data objects and/or associations
  }
}
```

```ts [New Model Function]
import type { Users, UsersData, UsersQuery } from 'my-feathers-api'
import { type ModelInstance, useFeathersModel, useInstanceDefaults } from 'feathers-pinia'
import { api } from '../feathers'

const service = api.service('users')

const modelFn = (data: ModelInstance<Users>) => {
  const withDefaults = useInstanceDefaults({ name: '', email: '', password: '' }, data)
  return withDefaults
}
const User = useFeathersModel<Users, UsersData, UsersQuery, typeof modelFn>(
  { name: 'User', idField: '_id', service },
  modelFn,
)
```

:::

## Important Changes

### No Model Constructors

The Model constructor is now the model function. If you have any constructor logic, move it into the model function.

### `useInstanceDefaults`

The `instanceDefaults` static Model function is replaced by the [useInstanceDefaults utility](/guide/model-functions-shared#useinstancedefaults).

### `setupInstance` Changes

This won't affect most apps, but the first argument to `setupInstance` was previously the passed in `data`. In v1.x, the first argument is the **actual instance**, which is it's no longer required to return a value from `setupInstance`. If you were editing the `data` argument, directly, your app should just work.  If your `setupInstance` just returned a value, you'll need to manually merge it into `data`, now.

### Model Static Attrs Moved

Two of the Model static attributes have moved:

- `Model.idField` is now `Model.store.idField`.
- `Model.tempIdField` is now `Model.store.tempIdField`.
