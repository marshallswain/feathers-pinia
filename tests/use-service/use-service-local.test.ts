import { useServiceLocal, useServiceStorage, useServiceTemps, useBaseModel, type ModelInstance } from '../../src'
import { ref } from 'vue-demi'
import { AnyData } from '../../src/use-service'

interface Items {
  id: number
  name: string
}

const modelFn = (data: ModelInstance<Items>) => {
  return data
}
const Item = useBaseModel<Items, Items, typeof modelFn>({ name: 'Item', idField: '_id' }, modelFn)

// Make sure the provided item is a model "instance" (in quotes because it's not a class)
const assureInstance = (item: AnyData) => {
  const Model = Item
  return item.__modelName ? item : Model ? Model(item) : item
}
const itemStorage = useServiceStorage({ getId: (item) => item.id, onRead: assureInstance, beforeWrite: assureInstance })
// temp item storage
const { tempStorage } = useServiceTemps({
  getId: (item) => item.__tempId,
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

  test('findInStore with $and', () => {
    const results = findInStore.value({
      query: {
        $and: [{ id: 1 }, { name: 'Goose' }],
      },
    })
    expect(results.data.length).toBe(1)
  })

  test('findInStore with $or', () => {
    const results = findInStore.value({
      query: {
        $or: [{ id: 1 }, { name: 'Moose' }],
      },
    })
    expect(results.data.length).toBe(2)
  })

  test('findInStore with exact filter', () => {
    const results = findInStore.value({ query: { name: 'Juice' } })
    expect(results.data.length).toBe(1)
  })

  test('findInStore with regex filter', () => {
    const results = findInStore.value({ query: { name: { $regex: /oose/ } } })
    expect(results.data.length).toBe(3)
  })

  test('findInStore with params.clones', () => {
    const results = findInStore.value({ query: {}, clones: true })
    results.data.forEach((item) => {
      expect(item.__isClone).toBeTruthy()
    })
    expect(results.data.length).toBe(5)
  })

  test('findInStore with params.clones reuses clones', () => {
    const results = findInStore.value({ query: {}, clones: true })
    results.data[1].name = 'Harvey'

    const results2 = findInStore.value({ query: {}, clones: true })
    expect(results2.data[1].name).toBe('Harvey')

    results.data.forEach((item) => {
      expect(item.__isClone).toBeTruthy()
    })
    expect(results.data.length).toBe(5)
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

  test('getFromStore with params.clones', () => {
    const item = getFromStore.value(1, { clones: true })
    expect(item?.id).toBe(1)
    expect(item?.__isClone).toBe(true)
  })

  // test('getFromStore with params.clones and a non-model record in clonesById', () => {
  //   ;(Item.store.clonesById as any)[2] = { id: 2, name: 'Moose' }
  //   const item = getFromStore.value(1, { clones: false })
  //   const clone = item?.clone()
  //   expect(item?.id).toBe(1)
  //   expect(item?.__isClone).toBe(true)
  // })

  test('getFromStore invalid id', () => {
    const item = getFromStore.value('one')
    expect(item).toBe(null)
  })
})
