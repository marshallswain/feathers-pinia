import { setupFeathersPinia, BaseModel } from '../../src/index' // from 'feathers-pinia'
import { createPinia } from 'pinia'
import { api } from '../feathers'
import { resetStores } from '../test-utils'

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
