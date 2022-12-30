---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Shared Model Function Utilities

[[toc]]

These utilities can be used by any type of Model Function.

## useInstanceDefaults

The `useInstanceDefaults(defaults, data)` utility allows you to specify default values to assign to new instances. It
only assigns a value if it the attribute not already specified on the incoming object.

```ts
import type { Users, UsersData, UsersQuery } from 'my-feathers-api'
import { type ModelInstance, useFeathersModel, useInstanceDefaults } from 'feathers-pinia'
import { api } from '../feathers'

const service = api.service('users')

const ModelFn = (data: ModelInstance<Users>) => {
  const withDefaults = useInstanceDefaults({ name: '', email: '', password: '' }, data)
  return withDefaults
}
const User = useFeathersModel<Users, UsersData, UsersQuery, typeof ModelFn>(
  { name: 'User', idField: '_id', service },
  ModelFn,
)
```

Now when you create a `User` the object will have default values applied:

<BlockQuote label="note" type="warning">

Any key that exists on the incoming data will not be replaced by a default value, even if the value of that key is
`undefined`.

</BlockQuote>

```ts
// if no properties are passed, the defaults will all apply
const user = User({})
console.log(user) // --> { name: 'Marshall', email: '', password: '' }

// If partial keys are passed, non-passed keys will have defaults applied.
const user = User({ name: 'Marshall' })
console.log(user) // --> { name: 'Marshall', email: '', password: '' }

// any "own property" that's present on the object will not be replaced by a default value, even `undefined` values.
const user = User({ name: undefined })
console.log(user) // --> { name: undefined, email: '', password: '' }
```

## useFeathersInstance

The `useFeathersInstance({ service }, data)` utility adds [FeathersModel Instance](/guide/use-feathers-model-instances)
functionality to incoming data. It is already used under the hood by [FeathersModel](/guide/use-feathers-model), so it
should only be used in [BaseModel Functions](/guide/use-base-model).

```ts
import { type ModelInstance, useInstanceDefaults, useFeathersInstance, useBaseModel } from 'feathers-pinia'

const ModelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({ description: '', isComplete: false }, data)
  const asFeathersInstance = useFeathersInstance({ service }, withDefaults)
  return asFeathersInstance
}
const Task = useBaseModel<Tasks, TasksQuery, typeof ModelFn>({ name: 'Task', idField: '_id' }, ModelFn)
```

The difference between `FeathersModel` and `BaseModel` + FeathersModel Instances is only in the Model's static methods.
Compare the static interface on the [Model Functions](/guide/model-functions#compare-static-properties) page. If
you prefer a store-centric workflow over a Model-centered workflow, you might want to stick with BaseModel to assure the
team writes consistent code, if that's your preference.
