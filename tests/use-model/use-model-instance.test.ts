import type { Tasks } from '../feathers-schema-tasks'
import { useInstanceModel, type BaseModelData, useModelBase } from '../../src/use-base-model/index'

const Task = useModelBase((data: Partial<Tasks & BaseModelData>) => {
  const asModel = useInstanceModel(data, { name: 'Task', idField: '_id' })

  return asModel
})

describe('useInstanceModel', () => {
  test('__Model prop', async () => {
    const task = Task({ description: 'test' })
    expect(typeof task.__Model).toBe('function')
  })

  test('__idField prop', async () => {
    const task = Task({ description: 'test' })
    expect(task.__idField).toBe('_id')
  })

  test('__isClone prop', async () => {
    const task = Task({ description: 'test' })
    expect(task.__isClone).toBe(false)
  })

  test('__modelName prop', async () => {
    const task = Task({ description: 'test' })
    expect(task.__modelName).toBe('Task')
  })

  test('__tempId prop with no id', async () => {
    const task = Task({ description: 'test' })
    expect(typeof task.__tempId).toBe('string')
  })

  test('__tempId prop with id', async () => {
    const task = Task({ _id: '1', description: 'test' })
    expect(task.__tempId).toBe(undefined)
  })

  test('__tempIdField prop', async () => {
    const task = Task({ _id: '1', description: 'test' })
    expect(task.__tempIdField).toBe('__tempId')
  })

  test('clone prop', async () => {
    const task = Task({ _id: '1', description: 'test' })
    expect(typeof task.clone).toBe('function')
  })

  test('commit prop', async () => {
    const task = Task({ _id: '1', description: 'test' })
    expect(typeof task.commit).toBe('function')
  })

  test('reset prop', async () => {
    const task = Task({ _id: '1', description: 'test' })
    expect(typeof task.reset).toBe('function')
  })
})
