import { setupFeathersPinia, BaseModel } from '../../src/index' // from 'feathers-pinia'
import { createPinia } from 'pinia'
import { api } from '../feathers'
import { resetStores } from '../test-utils'

const pinia = createPinia()
const { defineStore } = setupFeathersPinia({ clients: { api } })

export class Message extends BaseModel {
  id: number
  text: string
  description?: string

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

// Tests for $or
describe('findInStore with _or', () => {
  beforeEach(async () => {
    reset()
    api.service('messages').store = {
      1: { id: 1, text: 'Moose', description: 'one' },
      2: { id: 2, text: 'moose', description: 'two' },
      3: { id: 3, text: 'Goose', description: 'three' },
      4: { id: 4, text: 'Loose', description: 'four' },
    }
    await messageStore.find({ query: {} })
  })
  afterAll(() => reset())

  test('Can use or on store queries', async () => {
    const { data } = messageStore.findInStore({
      query: {
        $or: [{ text: 'Moose' }, { text: 'Goose' }],
      },
    })
    const textValues = data.map((i) => i.text)
    expect(textValues).toEqual(['Moose', 'Goose'])
  })
})

describe('Filtering With findInStore', () => {
  beforeEach(async () => {
    reset()
    api.service('messages').store = {
      1: { id: 1, text: 'Moose', description: 'one' },
      2: { id: 2, text: 'moose', description: 'two' },
      3: { id: 3, text: 'Goose', description: 'three' },
      4: { id: 4, text: 'Loose', description: 'four' },
    }
    await messageStore.find({ query: {} })
  })
  afterAll(() => reset())

  test('select always returns the entire instance', async () => {
    // There's not really a need for $select on the client. It is intended to decrease the amount of data
    // returned from the server.  Plus, $select would result in non-instance partial copies of data as plain
    // objects and not instances, so you'd lose the ability to call instance.save if we didn't return the instance.
    const { data } = messageStore.findInStore({ query: { $select: ['text'] } })
    data.forEach((m) => {
      expect(m.text)
      expect(m.description)
    })
  })
})
