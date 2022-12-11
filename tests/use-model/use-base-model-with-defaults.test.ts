import type { Tasks, TasksQuery } from '../feathers-schema-tasks'
import { useBaseModel, useInstanceDefaults, type ModelInstance } from '../../src/use-base-model/index'

const ModelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({ test: true, foo: 'bar', description: 'default' }, data)
  return withDefaults
}
const Task = useBaseModel<Tasks, TasksQuery, typeof ModelFn>({ name: 'Task', idField: '_id' }, ModelFn)

describe('useInstanceDefaults', () => {
  test('has defaults', async () => {
    const task = Task({})
    expect(task.test).toBe(true)
    expect(task.foo).toBe('bar')
    expect(task.description).toBe('default')
  })

  test('overwrite defaults with data', async () => {
    const task = Task({ description: 'foo', isComplete: true })
    expect(task.description).toBe('foo')
    expect(task.isComplete).toBe(true)
  })
})
