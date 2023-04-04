```ts
import type { ModelInstance } from 'feathers-pinia'
import type { Tasks, TasksData, TasksQuery } from 'feathers-pinia-api'

export const useTasksConfig = () => {
  const { pinia, idField, whitelist } = useFeathersPiniaConfig()
  const servicePath = 'tasks'
  const service = useFeathersService<Tasks, TasksQuery>(servicePath)
  const name = 'Task'

  return { pinia, idField, whitelist, servicePath, service, name }
}

export const useTaskModel = () => {
  const { idField, service, name } = useTasksConfig()

  const Model = useModel(name, () => {
    const modelFn = (data: ModelInstance<Tasks>) => {
      const defaults = {
        description: '',
        isComplete: false,
      }
      const withDefaults = useInstanceDefaults(defaults, data)
      return withDefaults
    }
    return useFeathersModel<Tasks, TasksData, TasksQuery, typeof modelFn>({ name, idField, service }, modelFn)
  })

  onModelReady(name, () => {
    service.hooks({ around: { all: [...feathersPiniaHooks(Model)] } })
  })
  connectModel(name, () => Model, useTaskStore)

  return Model
}
```

Since we wrapped our Models in utility functions, we can use them with auto-imports just like any utility in
`composables`:

```vue
<script setup lang="ts">
const User = useUserModel()
const Task = useTaskModel()
</script>
```
