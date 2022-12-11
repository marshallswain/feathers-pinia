import type { Tasks, TasksQuery } from '../feathers-schema-tasks'
import { useBaseModel, useInstanceDefaults, type ModelInstance } from '../../src/use-base-model/index'

const ModelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({ isComplete: false }, data)
  return withDefaults
}
const Task = useBaseModel<Tasks, TasksQuery, typeof ModelFn>({ name: 'Task', idField: '_id' }, ModelFn)

describe('useModelBase Model properties', () => {
  beforeEach(() => {
    Task.clearAll()
  })

  test('additionalFields property', () => {
    expect(Array.isArray(Task.additionalFields)).toBeTruthy()
  })

  test('itemsById property', () => {
    expect(Task.itemsById).toBeTruthy()
    expect(Task.itemsById.value).toBeFalsy()
  })

  test('items property', () => {
    expect(Array.isArray(Task.items.value)).toBeTruthy()
  })

  test('itemIds property', () => {
    expect(Array.isArray(Task.itemIds.value)).toBeTruthy()
  })

  test('tempsById property', () => {
    expect(Task.tempsById).toBeTruthy()
    expect(Task.tempsById.value).toBeFalsy()
  })

  test('temps property', () => {
    expect(Array.isArray(Task.temps.value)).toBeTruthy()
  })

  test('tempIds property', () => {
    expect(Array.isArray(Task.tempIds.value)).toBeTruthy()
  })

  test('clonesById property', () => {
    expect(Task.clonesById).toBeTruthy()
    expect(Task.clonesById.value).toBeFalsy()
  })

  test('clones property', () => {
    expect(Array.isArray(Task.clones.value)).toBeTruthy()
  })

  test('cloneIds property', () => {
    expect(Array.isArray(Task.cloneIds.value)).toBeTruthy()
  })

  test('clone property', () => {
    expect(typeof Task.clone).toBe('function')
  })

  test('commit property', () => {
    expect(typeof Task.commit).toBe('function')
  })

  test('reset property', () => {
    expect(typeof Task.reset).toBe('function')
  })

  test('addToStore property', () => {
    expect(typeof Task.addToStore).toBe('function')
  })

  test('removeFromStore property', () => {
    expect(typeof Task.removeFromStore).toBe('function')
  })

  test('clearAll property', () => {
    expect(typeof Task.clearAll).toBe('function')
  })
})
