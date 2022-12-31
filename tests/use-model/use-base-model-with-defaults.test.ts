import type { Tasks, TasksQuery } from '../feathers-schema-tasks'
import { useBaseModel, useInstanceDefaults, type ModelInstance } from '../../src/use-base-model/index'

const modelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({ description: '', isComplete: false }, data)
  return withDefaults
}
const Task = useBaseModel<Tasks, TasksQuery, typeof modelFn>({ name: 'Task', idField: '_id' }, modelFn)

describe('useInstanceDefaults', () => {
  test('has defaults', async () => {
    const task = Task({})
    expect(task.description).toBe('')
    expect(task.isComplete).toBe(false)
  })

  test('overwrite defaults with data', async () => {
    const task = Task({ description: 'foo', isComplete: true })
    expect(task.description).toBe('foo')
    expect(task.isComplete).toBe(true)
  })
})
