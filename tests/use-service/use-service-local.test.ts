import { useServiceLocal, useServiceStorage, useServiceTemps } from '../../src'
import { del, ref } from 'vue-demi'

const itemStorage = useServiceStorage({ getId: (item) => item.id })
// temp item storage
const { tempStorage } = useServiceTemps({
  getId: (item) => item.__tempId,
  removeId: (item) => del(item, '__tempId'),
  itemStorage,
})

const { findInStore, countInStore, getFromStore } = useServiceLocal({
  idField: ref('id'),
  itemStorage,
  tempStorage,
  whitelist: ref([]),
  paramsForServer: ref([]),
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
    items.forEach((i) => itemStorage.set(i))
  })
  test('findInStore', () => {
    const results = findInStore.value({ query: {} })
    expect(results.data.length).toBe(5)
  })

  test('findInStore with exact filter', () => {
    const results = findInStore.value({ query: { name: 'Juice' } })
    expect(results.data.length).toBe(1)
  })

  test('findInStore with regex filter', () => {
    const results = findInStore.value({ query: { name: { $regex: /oose/ } } })
    expect(results.data.length).toBe(3)
  })

  test('countInStore', () => {
    const result = countInStore.value({ query: {} })
    expect(result).toBe(5)
  })

  test('countInStore with exact filter', () => {
    const result = countInStore.value({ query: { name: 'Juice' } })
    expect(result).toBe(1)
  })

  test('countInStore with regex filter', () => {
    const result = countInStore.value({ query: { name: { $regex: /oose/ } } })
    expect(result).toBe(3)
  })

  test('getFromStore', () => {
    const item = getFromStore.value(1)
    expect(item?.id).toBe(1)
  })

  test('getFromStore invalid id', () => {
    const item = getFromStore.value('one')
    expect(item).toBe(null)
  })
})