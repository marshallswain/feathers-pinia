```ts
// src/models/task.ts
import type { Tasks, TasksQuery } from '../feathers-schema-tasks'
import { defineStore, createPinia } from 'pinia'
import { type ModelInstance, useBaseModel, useInstanceDefaults, useService, syncWithStorage, feathersPiniaHooks } from 'feathers-pinia'
import { api } from '../feathers'

const pinia = createPinia()
const service = api.service('tasks')

// Create a Model Function
const modelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({ description: '' }, data)
  return withDefaults
}
const Task = useFeathersModel<Tasks, TasksData, TasksQuery, typeof modelFn>(
  { name: 'Task', idField: '_id', service },
  modelFn,
)

// register hooks in the `around all` array
service.hooks({ around: { all: [...feathersPiniaHooks(Task)] } })

// Create a store
export const useTaskStore = defineStore('tasks', () => {
  const serviceUtils = useService<TaskInstance, TasksData, TasksQuery, typeof modelFn>({
    service,
    idField: '_id',
    Model: Task,
  })

  return { ...serviceUtils }
})

// instantiate the store
const taskStore = useTaskStore(pinia)

// replace the Task model's store
Task.setStore(taskStore)

// optionally sync with storage
syncWithStorage(taskStore, ['ids', 'itemsById'])
```
