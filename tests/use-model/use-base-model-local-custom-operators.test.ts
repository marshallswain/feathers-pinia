import sift, { createEqualsOperation } from 'sift'
import { like, iLike, operations } from '../../src/utils-custom-operators'
import type { Tasks } from '../feathers-schema-tasks'
import { useBaseModel, useInstanceDefaults, type ModelInstance } from '../../src/use-base-model/index'

interface TasksQuery {
  description?: {
    $like?: string
    $notLike?: string
    $ilike?: string
    $iLike?: string
    $notILike?: string
  }
}

const ModelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({ isComplete: false }, data)
  return withDefaults
}
const Task = useBaseModel<Tasks, TasksQuery, typeof ModelFn>({ name: 'Task', idField: '_id' }, ModelFn)

describe('Custom Getter Operators', () => {
  test('can implement custom operator', () => {
    function $customMod(params, ownerQuery, options) {
      return createEqualsOperation((value) => value % params !== 0, ownerQuery, options)
    }
    const filter = sift({ $customMod: 2 }, { operations: { $customMod } })
    const values = [1, 2, 3, 4, 5].filter(filter) // 1, 3, 5
    expect(values).toEqual([1, 3, 5])
  })

  test('can simulate case-sensitive LIKE in regex', async () => {
    const result = like('Moose', 'M%')
    expect(result).toBe(true)

    const result2 = like('Moose', 'm%')
    expect(result2).toBe(false)
  })

  test('can simulate case-insensitive ILIKE in regex', async () => {
    const result = iLike('Moose', 'm%')
    expect(result).toBe(true)

    const result2 = iLike('Moose', 'M%')
    expect(result2).toBe(true)
  })
})

describe('Filtering Strings With Sift', () => {
  const words = ['Moose', 'moose', 'Goose', 'Loose']

  test('can filter strings by like', async () => {
    const filter = sift({ $like: '%Mo%' }, { operations })
    const values = words.filter(filter)
    expect(values).toEqual(['Moose'])
  })

  test('can filter strings by notLike', async () => {
    const filter = sift({ $notLike: '%Mo%' }, { operations })
    const values = words.filter(filter)
    expect(values).toEqual(['moose', 'Goose', 'Loose'])
  })

  test('can filter strings by ilike', async () => {
    const filter = sift({ $ilike: '%Mo%' }, { operations })
    const values = words.filter(filter)
    expect(values).toEqual(['Moose', 'moose'])
  })

  test('can filter strings by notILike', async () => {
    const filter = sift({ $notILike: '%Mo%' }, { operations })
    const values = words.filter(filter)
    expect(values).toEqual(['Goose', 'Loose'])
  })
})

describe('Filtering Objects With Sift', () => {
  const words = [{ name: 'Moose' }, { name: 'moose' }, { name: 'Goose' }, { name: 'Loose' }]

  test('can filter objects by like', async () => {
    const filter = sift({ name: { $like: '%Mo%' } }, { operations })
    const values = words.filter(filter)
    expect(values).toEqual([{ name: 'Moose' }])
  })

  test('can filter objects by notLike', async () => {
    const filter = sift({ name: { $notLike: '%Mo%' } }, { operations })
    const values = words.filter(filter)
    expect(values).toEqual([{ name: 'moose' }, { name: 'Goose' }, { name: 'Loose' }])
  })

  test('can filter objects by ilike', async () => {
    const filter = sift({ name: { $ilike: '%Mo%' } }, { operations })
    const values = words.filter(filter)
    expect(values).toEqual([{ name: 'Moose' }, { name: 'moose' }])
  })

  test('can filter objects by notILike', async () => {
    const filter = sift({ name: { $notILike: '%Mo%' } }, { operations })
    const values = words.filter(filter)
    expect(values).toEqual([{ name: 'Goose' }, { name: 'Loose' }])
  })
})

describe('Filtering With findInStore', () => {
  beforeEach(async () => {
    Task.store.clearAll()
    Task.store.addToStore([
      { _id: 1, description: 'Moose' },
      { _id: 2, description: 'moose' },
      { _id: 3, description: 'Goose' },
      { _id: 4, description: 'Loose' },
    ])
  })

  test('can filter objects by like', async () => {
    const { data: $like } = Task.findInStore({ query: { description: { $like: '%Mo%' } } })
    expect($like.map((m) => m._id)).toEqual([1])
  })

  test('can filter objects by notLike', async () => {
    const { data: $notLike } = Task.findInStore({ query: { description: { $notLike: '%Mo%' } } })
    expect($notLike.map((m) => m._id)).toEqual([2, 3, 4])
  })

  test('can filter objects by ilike', async () => {
    const { data: $ilike } = Task.findInStore({ query: { description: { $ilike: '%Mo%' } } })
    expect($ilike.map((m) => m._id)).toEqual([1, 2])
  })

  test('can filter objects by iLike', async () => {
    const { data: $iLike } = Task.findInStore({ query: { description: { $iLike: '%Mo%' } } })
    expect($iLike.map((m) => m._id)).toEqual([1, 2])
  })

  test('can filter objects by notILike', async () => {
    const { data: $notILike } = Task.findInStore({ query: { description: { $notILike: '%Mo%' } } })
    expect($notILike.map((m) => m._id)).toEqual([3, 4])
  })
})
