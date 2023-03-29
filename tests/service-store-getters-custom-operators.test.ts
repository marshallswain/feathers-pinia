import sift, { createEqualsOperation } from 'sift'
import { like, iLike, operations } from '../src/utils-custom-operators'
import { setupFeathersPinia, BaseModel } from '../src/index' // from 'feathers-pinia'
import { createPinia } from 'pinia'
import { api } from './feathers'
import { resetStores } from './test-utils'

const pinia = createPinia()
const { defineStore } = setupFeathersPinia({ clients: { api } })

export class Message extends BaseModel {
  id: number
  text: string

  constructor(data: Partial<Message>, options: Record<string, any> = {}) {
    super(data, options)
    this.init(data)
  }
}

const useMessagesService = defineStore({ servicePath: 'messages', Model: Message })
const messageStore = useMessagesService(pinia)

const reset = () => {
  resetStores(api.service('messages'), messageStore)
}

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
    reset()
    api.service('messages').store = {
      1: { id: 1, text: 'Moose' },
      2: { id: 2, text: 'moose' },
      3: { id: 3, text: 'Goose' },
      4: { id: 4, text: 'Loose' },
    }
    await messageStore.find({ query: {} })
  })
  afterAll(() => reset())

  test('can use $and', async () => {
    const { data } = messageStore.findInStore({
      query: {
        $and: [{ id: 1 }, { text: 'Moose' }],
      },
    })
    expect(data.length).toEqual(1)
  })

  test('can use $or', async () => {
    const { data } = messageStore.findInStore({
      query: {
        $or: [{ id: 1 }, { text: 'Goose' }],
      },
    })
    expect(data.length).toEqual(2)
  })

  test('can filter objects by like', async () => {
    const { data: $like } = messageStore.findInStore({ query: { text: { $like: '%Mo%' } } })
    expect($like.map((m) => m.id)).toEqual([1])
  })

  test('can filter objects by notLike', async () => {
    const { data: $notLike } = messageStore.findInStore({ query: { text: { $notLike: '%Mo%' } } })
    expect($notLike.map((m) => m.id)).toEqual([2, 3, 4])
  })

  test('can filter objects by ilike', async () => {
    const { data: $ilike } = messageStore.findInStore({ query: { text: { $ilike: '%Mo%' } } })
    expect($ilike.map((m) => m.id)).toEqual([1, 2])
  })

  test('can filter objects by iLike', async () => {
    const { data: $iLike } = messageStore.findInStore({ query: { text: { $iLike: '%Mo%' } } })
    expect($iLike.map((m) => m.id)).toEqual([1, 2])
  })

  test('can filter objects by notILike', async () => {
    const { data: $notILike } = messageStore.findInStore({ query: { text: { $notILike: '%Mo%' } } })
    expect($notILike.map((m) => m.id)).toEqual([3, 4])
  })
})
