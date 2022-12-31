import type { Tasks, TasksQuery } from '../feathers-schema-tasks'
import { type ModelInstance, useBaseModel, useInstanceDefaults } from '../../src'

const modelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({ description: '', isComplete: false }, data)
  return withDefaults
}
const Task = useBaseModel<Tasks, TasksQuery, typeof modelFn>({ name: 'Task', idField: '_id' }, modelFn)

describe('useInstanceModel props', () => {
  beforeEach(() => {
    Task.store.clearAll()
  })

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

  test('__tempId prop without id', async () => {
    const task = Task({ description: 'test' })
    expect(task.__tempId).toBeDefined()
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

  test('addToStore props', async () => {
    const task = Task({ _id: '1', description: 'test' })
    expect(typeof task.addToStore).toBe('function')
  })

  test('removeFromStore props', async () => {
    const task = Task({ _id: '1', description: 'test' })
    expect(typeof task.removeFromStore).toBe('function')
  })

  test('instances are still instances after addToStore', async () => {
    const task = Task({ _id: '1', description: 'test' }).addToStore()
    expect(task.__Model).toBeDefined()
    expect(task.__idField).toBeDefined()
    expect(task.__isClone).toBeDefined()
    expect(task.__isTemp).toBeDefined()
    expect(task.__modelName).toBeDefined()
    expect(task.addToStore).toBeDefined()
    expect(task.clone).toBeDefined()
    expect(task.commit).toBeDefined()
    expect(task.reset).toBeDefined()
    expect(task.removeFromStore).toBeDefined()
  })

  test('instances are still instances after clone', async () => {
    const task = Task({ _id: '1', description: 'test' }).clone()
    expect(task.__Model).toBeDefined()
    expect(task.__idField).toBeDefined()
    expect(task.__isClone).toBeDefined()
    expect(task.__isTemp).toBeDefined()
    expect(task.__modelName).toBeDefined()
    expect(task.addToStore).toBeDefined()
    expect(task.clone).toBeDefined()
    expect(task.commit).toBeDefined()
    expect(task.reset).toBeDefined()
    expect(task.removeFromStore).toBeDefined()
  })

  test('instances are still instances after clone and commit', async () => {
    const _task = Task({ _id: '1', description: 'test' }).clone()
    const task = _task.commit()
    expect(task.__Model).toBeDefined()
    expect(task.__idField).toBeDefined()
    expect(task.__isClone).toBeDefined()
    expect(task.__isTemp).toBeDefined()
    expect(task.__modelName).toBeDefined()
    expect(task.addToStore).toBeDefined()
    expect(task.clone).toBeDefined()
    expect(task.commit).toBeDefined()
    expect(task.reset).toBeDefined()
    expect(task.removeFromStore).toBeDefined()
  })

  test('instances are still instances after clone and commit', async () => {
    const _task = Task({ _id: '1', description: 'test' }).clone()
    const task = _task.reset()
    expect(task.__Model).toBeDefined()
    expect(task.__idField).toBeDefined()
    expect(task.__isClone).toBeDefined()
    expect(task.__isTemp).toBeDefined()
    expect(task.__modelName).toBeDefined()
    expect(task.addToStore).toBeDefined()
    expect(task.clone).toBeDefined()
    expect(task.commit).toBeDefined()
    expect(task.reset).toBeDefined()
    expect(task.removeFromStore).toBeDefined()
  })

  test('instances are still instances after removeFromStore', async () => {
    const _task = Task({ _id: '1', description: 'test' }).addToStore()
    const task = _task.removeFromStore()
    expect(task.__Model).toBeDefined()
    expect(task.__idField).toBeDefined()
    expect(task.__isClone).toBeDefined()
    expect(task.__isTemp).toBeDefined()
    expect(task.__modelName).toBeDefined()
    expect(task.addToStore).toBeDefined()
    expect(task.clone).toBeDefined()
    expect(task.commit).toBeDefined()
    expect(task.reset).toBeDefined()
    expect(task.removeFromStore).toBeDefined()
  })

  test('instances are still instances after findInStore', async () => {
    Task({ _id: '1', description: 'test' }).addToStore()
    const [task] = Task.findInStore({ query: {} }).data
    expect(task.__Model).toBeDefined()
    expect(task.__idField).toBeDefined()
    expect(task.__isClone).toBeDefined()
    expect(task.__isTemp).toBeDefined()
    expect(task.__modelName).toBeDefined()
    expect(task.addToStore).toBeDefined()
    expect(task.clone).toBeDefined()
    expect(task.commit).toBeDefined()
    expect(task.reset).toBeDefined()
    expect(task.removeFromStore).toBeDefined()
  })

  test('instances are still instances after findInStore', async () => {
    Task({ _id: '1', description: 'test' }).addToStore()
    const task = Task.getFromStore('1')
    expect(task?.__Model).toBeDefined()
    expect(task?.__idField).toBeDefined()
    expect(task?.__isClone).toBeDefined()
    expect(task?.__isTemp).toBeDefined()
    expect(task?.__modelName).toBeDefined()
    expect(task?.addToStore).toBeDefined()
    expect(task?.clone).toBeDefined()
    expect(task?.commit).toBeDefined()
    expect(task?.reset).toBeDefined()
    expect(task?.removeFromStore).toBeDefined()
  })
})
