import type { Tasks } from '../feathers-schema-tasks'
import { useInstanceModel, type BaseModelData, useInstanceDefaults, useModelBase } from '../../src/use-base-model/index'

const Task = useModelBase((data: Partial<Tasks & BaseModelData>) => {
  const asModel = useInstanceModel(data, { name: 'Task', idField: '_id', ModelFn: Task })
  const withDefaults = useInstanceDefaults({ test: true, foo: 'bar', description: 'default' }, asModel)

  return withDefaults
})

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
