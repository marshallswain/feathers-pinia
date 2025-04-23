import { useAllStorageTypes, useServiceLocal } from '../../src'

const idField = 'id'
const { itemStorage, tempStorage, addItemToStorage } = useAllStorageTypes({
  getIdField: (val: any) => val[idField],
  setupInstance: data => data,
})
const { findInStore, countInStore, getFromStore } = useServiceLocal({
  idField: 'id',
  itemStorage,
  tempStorage,
  whitelist: [],
  paramsForServer: [],
  addItemToStorage,
})

describe('use-service-local', () => {
  beforeEach(() => {
    const items = [
      { id: 1, name: 'Goose' },
      { id: 2, name: 'Moose' },
      { id: 3, name: 'Loose' },
      { id: 4, name: 'Juice' },
      { id: 5, name: 'King Bob' },
    ]
    items.forEach(i => itemStorage.set(i))
  })
  it('findInStore', () => {
    const results = findInStore({ query: {} })
    expect(results.data.length).toBe(5)
  })

  it('findInStore with $and', () => {
    const results = findInStore({
      query: {
        $and: [{ id: 1 }, { name: 'Goose' }],
      },
    })
    expect(results.data.length).toBe(1)
  })

  it('findInStore with $or', () => {
    const results = findInStore({
      query: {
        $or: [{ id: 1 }, { name: 'Moose' }],
      },
    })
    expect(results.data.length).toBe(2)
  })

  it('findInStore with exact filter', () => {
    const results = findInStore({ query: { name: 'Juice' } })
    expect(results.data.length).toBe(1)
  })

  it('findInStore with regex filter', () => {
    const results = findInStore({ query: { name: { $regex: /oose/ } } })
    expect(results.data.length).toBe(5)
  })

  it('findInStore with params.clones does nothing when items are not instances (no service)', () => {
    const results = findInStore({ query: {}, clones: true })
    results.data.forEach((item) => {
      expect(item.__isClone).not.toBeDefined()
    })
    expect(results.data.length).toBe(5)
  })

  it('countInStore', () => {
    const result = countInStore({ query: {} }).value
    expect(result).toBe(5)
  })

  it('countInStore with exact filter', () => {
    const result = countInStore({ query: { name: 'Juice' } }).value
    expect(result).toBe(1)
  })

  it('countInStore with regex filter', () => {
    const result = countInStore({ query: { name: { $regex: /oose/ } } }).value
    expect(result).toBe(5)
  })

  it('getFromStore', () => {
    const item = getFromStore(1).value
    expect(item?.id).toBe(1)
  })

  it('getFromStore with params.clones does nothing without service', () => {
    const item = getFromStore(1, { clones: true }).value
    expect(item?.id).toBe(1)
    expect(item?.__isClone).not.toBeDefined()
  })

  it('getFromStore invalid id', () => {
    const item = getFromStore('one').value
    expect(item).toBe(null)
  })
})
