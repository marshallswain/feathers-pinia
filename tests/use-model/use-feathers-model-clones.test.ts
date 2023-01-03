import type { Tasks, TasksData, TasksQuery } from '../feathers-schema-tasks'
import { useFeathersModel, useInstanceDefaults, type ModelInstance } from '../../src/use-base-model/index'
import { api } from '../feathers'

const modelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({ isComplete: false }, data)
  return withDefaults
}
const Task = useFeathersModel<Tasks, TasksData, TasksQuery, typeof modelFn>(
  { name: 'Task', idField: '_id', service: api.service('tasks') },
  modelFn
)

describe('useModelInstance clones', () => {
  beforeEach(() => {
    Task.store.clearAll()
  })

  test('saving a clone', async () => {
    const task = Task({ description: 'test' })
    const clone = task.clone()
    const result = await clone.save()
    expect(result).toBe(clone)
    expect(result).not.toBe(task)

    const original = Task.getFromStore(result._id as string)
    expect(result).not.toBe(original)
  })
})
