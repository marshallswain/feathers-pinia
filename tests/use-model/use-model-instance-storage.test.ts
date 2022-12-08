import type { Tasks } from '../feathers-schema-tasks'
import { useInstanceModel, type BaseModelData, useModelBase } from '../../src/use-base-model/index'

const Task = useModelBase<Partial<Tasks & BaseModelData>>((data) => {
  const asModel = useInstanceModel(data, { name: 'Task', idField: '_id' })

  return asModel
})

describe('useModelInstance temps', () => {
  beforeEach(() => {
    Task.clearAll()
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
    expect(Task.items.value.length).toBe(0)
    expect(Task.temps.value.length).toBe(0)
    expect(Task.clones.value.length).toBe(0)
  })

  test('call addToStore without id to add to tempStore', () => {
    const task = Task({ description: 'foo', isComplete: true }).addToStore()
    expect(Task.temps.value.length).toBe(1)
    expect(Task.temps.value[0]).toBe(task)
  })

  test('call addToStore with id to add to itemStore', () => {
    const task = Task({ _id: '1', description: 'foo', isComplete: true }).addToStore()
    expect(Task.items.value.length).toBe(1)
    expect(Task.items.value[0]).toBe(task)
  })

  test('call removeFromStore on temp', () => {
    const task = Task({ description: 'foo', isComplete: true }).addToStore()
    task.removeFromStore()
    expect(Task.temps.value.length).toBe(0)
  })

  test('call removeFromStore on item', () => {
    const task = Task({ _id: '1', description: 'foo', isComplete: true }).addToStore()
    task.removeFromStore()
    expect(Task.items.value.length).toBe(0)
  })
})
