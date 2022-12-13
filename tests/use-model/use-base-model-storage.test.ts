import type { Tasks, TasksQuery } from '../feathers-schema-tasks'
import { useBaseModel, useInstanceDefaults, type ModelInstance } from '../../src/use-base-model/index'

const ModelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({}, data)
  return withDefaults
}
const Task = useBaseModel<Tasks, TasksQuery, typeof ModelFn>({ name: 'Task', idField: '_id' }, ModelFn)

describe('useModelInstance temps', () => {
  beforeEach(() => {
    Task.store.clearAll()
  })

  test('assigns tempid when no id provided', async () => {
    const task = Task({ description: 'test' })
    expect(task.__tempId).toBeDefined()
  })

  test('has no __tempId id is present', async () => {
    const task = Task({ _id: '1', description: 'foo', isComplete: true })
    expect(task.__tempId).toBeUndefined()
  })

  test('not added to Model store by default', () => {
    Task({ description: 'foo', isComplete: true })
    expect(Task.store.items.length).toBe(0)
    expect(Task.store.temps.length).toBe(0)
    expect(Task.store.clones.length).toBe(0)
  })

  test('call addToStore without id to add to tempStore', () => {
    const task = Task({ description: 'foo', isComplete: true }).addToStore()
    expect(Task.store.temps.length).toBe(1)
    expect(Task.store.temps[0]).toBe(task)
  })

  test('call addToStore with id to add to itemStore', () => {
    const task = Task({ _id: '1', description: 'foo', isComplete: true }).addToStore()
    expect(Task.store.items.length).toBe(1)
    expect(Task.store.items[0]).toBe(task)
  })

  test('call removeFromStore on temp', () => {
    const task = Task({ description: 'foo', isComplete: true }).addToStore()
    task.removeFromStore()
    expect(Task.store.temps.length).toBe(0)
  })

  test('call removeFromStore on item', () => {
    const task = Task({ _id: '1', description: 'foo', isComplete: true }).addToStore()
    task.removeFromStore()
    expect(Task.store.items.length).toBe(0)
  })
})
