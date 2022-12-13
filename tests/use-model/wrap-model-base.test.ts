import type { Tasks, TasksQuery } from '../feathers-schema-tasks'
import { type ModelInstanceData, useInstanceDefaults, wrapModelBase } from '../../src'

const ModelFn = (data: ModelInstanceData<Tasks>) => {
  const withDefaults = useInstanceDefaults({ isComplete: false }, data)
  return withDefaults
}

const Task = wrapModelBase<Tasks, TasksQuery, typeof ModelFn>({ name: 'Task', idField: '_id' }, ModelFn)

describe('useModelBase Model.store properties', () => {
  beforeEach(() => {
    Task.store.clearAll()
  })

  test('itemsById property', () => {
    expect(Task.store.itemsById).toBeTruthy()
    expect(Task.store.itemsById.value).toBeFalsy()
  })

  test('items property', () => {
    expect(Array.isArray(Task.store.items)).toBeTruthy()
  })

  test('itemIds property', () => {
    expect(Array.isArray(Task.store.itemIds)).toBeTruthy()
  })

  test('tempsById property', () => {
    expect(Task.store.tempsById).toBeTruthy()
    expect(Task.store.tempsById.value).toBeFalsy()
  })

  test('temps property', () => {
    expect(Array.isArray(Task.store.temps)).toBeTruthy()
  })

  test('tempIds property', () => {
    expect(Array.isArray(Task.store.tempIds)).toBeTruthy()
  })

  test('clonesById property', () => {
    expect(Task.store.clonesById).toBeTruthy()
    expect(Task.store.clonesById.value).toBeFalsy()
  })

  test('clones property', () => {
    expect(Array.isArray(Task.store.clones)).toBeTruthy()
  })

  test('cloneIds property', () => {
    expect(Array.isArray(Task.store.cloneIds)).toBeTruthy()
  })

  test('clone property', () => {
    expect(typeof Task.store.clone).toBe('function')
  })

  test('commit property', () => {
    expect(typeof Task.store.commit).toBe('function')
  })

  test('reset property', () => {
    expect(typeof Task.store.reset).toBe('function')
  })

  test('addToStore property', () => {
    expect(typeof Task.store.addToStore).toBe('function')
    expect(typeof Task.addToStore).toBe('function')
  })

  test('removeFromStore property', () => {
    expect(typeof Task.store.removeFromStore).toBe('function')
    expect(typeof Task.removeFromStore).toBe('function')
  })

  test('clearAll property', () => {
    expect(typeof Task.store.clearAll).toBe('function')
  })
})
