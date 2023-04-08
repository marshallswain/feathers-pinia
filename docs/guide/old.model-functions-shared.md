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

## useFeathersInstance

The `useFeathersInstance({ service }, data)` utility adds [FeathersModel Instance](/guide/use-feathers-model-instances)
functionality to incoming data. It is already used under the hood by [FeathersModel](/guide/use-feathers-model), so it
should only be used in [BaseModel Functions](/guide/use-base-model).

```ts
import { type ModelInstance, useInstanceDefaults, useFeathersInstance, useBaseModel } from 'feathers-pinia'

const modelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({ description: '', isComplete: false }, data)
  const asFeathersInstance = useFeathersInstance({ service }, withDefaults)
  return asFeathersInstance
}
const Task = useBaseModel<Tasks, TasksQuery, typeof modelFn>({ name: 'Task', idField: '_id' }, modelFn)
```

The difference between `FeathersModel` and `BaseModel` + FeathersModel Instances is only in the Model's static methods.
Compare the static interface on the [Model Functions](/guide/model-functions#compare-static-properties) page. If
you prefer a store-centric workflow over a Model-centered workflow, you might want to stick with BaseModel to assure the
team writes consistent code, if that's your preference.
