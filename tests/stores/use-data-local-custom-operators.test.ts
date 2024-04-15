import sift, { createEqualsOperation } from 'sift'
import { api, makeContactsData } from '../fixtures/index.js'
import { iLike, like, sqlOperations } from '../../src/custom-operators/index.js'
import { resetService } from '../test-utils.js'

const service = api.service('contacts')

describe('Custom Getter Operators', () => {
  test('can implement custom operator', () => {
    function $customMod(params, ownerQuery, options) {
      return createEqualsOperation(value => value % params !== 0, ownerQuery, options)
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
    const filter = sift({ $like: '%Mo%' }, { operations: sqlOperations })
    const values = words.filter(filter)
    expect(values).toEqual(['Moose'])
  })

  test('can filter strings by notLike', async () => {
    const filter = sift({ $notLike: '%Mo%' }, { operations: sqlOperations })
    const values = words.filter(filter)
    expect(values).toEqual(['moose', 'Goose', 'Loose'])
  })

  test('can filter strings by ilike', async () => {
    const filter = sift({ $ilike: '%Mo%' }, { operations: sqlOperations })
    const values = words.filter(filter)
    expect(values).toEqual(['Moose', 'moose'])
  })

  test('can filter strings by notILike', async () => {
    const filter = sift({ $notILike: '%Mo%' }, { operations: sqlOperations })
    const values = words.filter(filter)
    expect(values).toEqual(['Goose', 'Loose'])
  })
})

describe('Filtering Objects With Sift', () => {
  const words = [{ name: 'Moose' }, { name: 'moose' }, { name: 'Goose' }, { name: 'Loose' }]

  test('can filter objects by like', async () => {
    const filter = sift({ name: { $like: '%Mo%' } }, { operations: sqlOperations })
    const values = words.filter(filter)
    expect(values).toEqual([{ name: 'Moose' }])
  })

  test('can filter objects by notLike', async () => {
    const filter = sift({ name: { $notLike: '%Mo%' } }, { operations: sqlOperations })
    const values = words.filter(filter)
    expect(values).toEqual([{ name: 'moose' }, { name: 'Goose' }, { name: 'Loose' }])
  })

  test('can filter objects by ilike', async () => {
    const filter = sift({ name: { $ilike: '%Mo%' } }, { operations: sqlOperations })
    const values = words.filter(filter)
    expect(values).toEqual([{ name: 'Moose' }, { name: 'moose' }])
  })

  test('can filter objects by notILike', async () => {
    const filter = sift({ name: { $notILike: '%Mo%' } }, { operations: sqlOperations })
    const values = words.filter(filter)
    expect(values).toEqual([{ name: 'Goose' }, { name: 'Loose' }])
  })
})

describe('Filtering With findInStore', () => {
  beforeEach(async () => {
    resetService(service)
    service.service.store = makeContactsData()
    await service.find({ query: { $limit: 100 } })
  })
  afterEach(() => resetService(service))

  test('can filter objects by like', async () => {
    const { data } = service.findInStore({ query: { name: { $like: '%Mo%' } } })
    expect(data.map(m => m._id)).toEqual(['1'])
  })

  test('can filter objects by notLike', async () => {
    const { data } = service.findInStore({ query: { name: { $notLike: '%Mo%' } } })
    expect(data.map(m => m._id)).toEqual(['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'])
  })

  test('can filter objects by ilike', async () => {
    const { data } = service.findInStore({ query: { name: { $ilike: '%Mo%' } } })
    expect(data.map(m => m._id)).toEqual(['1', '2'])
  })

  test('can filter objects by iLike', async () => {
    const { data } = service.findInStore({ query: { name: { $iLike: '%Mo%' } } })
    expect(data.map(m => m._id)).toEqual(['1', '2'])
  })

  test('can filter objects by notILike', async () => {
    const { data } = service.findInStore({ query: { name: { $notILike: '%Mo%' } } })
    expect(data.map(m => m._id)).toEqual(['3', '4', '5', '6', '7', '8', '9', '10', '11', '12'])
  })
})
