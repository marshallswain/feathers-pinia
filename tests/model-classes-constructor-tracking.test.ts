/* eslint-disable @typescript-eslint/no-unused-vars */
import { setupFeathersPinia, BaseModel } from '../src/index' // from 'feathers-pinia'
import { createPinia } from 'pinia'
import { api } from './feathers'

const pinia = createPinia()
const { defineStore } = setupFeathersPinia({ clients: { api } })

describe('Tracking Constructor Run Counts', () => {
  const resetStore = () => {
    api.service('messages').store = {}
  }
  beforeEach(() => resetStore())

  test('constructor runs once on new Model()', async () => {
    let runCount = 0
    // Setup
    class Message extends BaseModel {
      _id: number
      text = 'foo'
      constructor(data: Partial<Message>, options: Record<string, any> = {}) {
        super(data, options)
        this.init(data)
        runCount++
      }
    }
    const useMessagesService = defineStore({ servicePath: 'messages', Model: Message })
    const messagesService = useMessagesService(pinia)

    // Test
    const message = new Message({ text: 'Here I am!' })
    expect(runCount).toBe(1)
  })

  test('constructor runs only once when calling new Model().addToStore()', async () => {
    let runCount = 0
    // Setup
    class Message extends BaseModel {
      _id: number
      text = 'foo'
      constructor(data: Partial<Message>, options: Record<string, any> = {}) {
        super(data, options)
        this.init(data)
        runCount++
      }
    }
    const useMessagesService = defineStore({ servicePath: 'messages', Model: Message })
    const messagesService = useMessagesService(pinia)

    // Test
    const message = new Message({ text: 'Here I am!' }).addToStore() as Message
    expect(runCount).toBe(1)
  })

  test('constructor runs only once when calling new Model().addToStore().save()', async () => {
    let runCount = 0
    // Setup
    class Message extends BaseModel {
      _id: number
      text = 'foo'
      constructor(data: Partial<Message>, options: Record<string, any> = {}) {
        super(data, options)
        this.init(data)
        runCount++
      }
    }
    const useMessagesService = defineStore({ servicePath: 'messages', Model: Message })
    const messagesService = useMessagesService(pinia)

    // Test
    const message = (await new Message({ text: 'Here I am!' }).addToStore().save()) as Message
    expect(runCount).toBe(1)
  })

  test('constructor runs only once when calling new Model().addToStore.clone()', async () => {
    let runCount = 0
    // Setup
    class Message extends BaseModel {
      _id: number
      text = 'foo'
      constructor(data: Partial<Message>, options: Record<string, any> = {}) {
        super(data, options)
        this.init(data)
        runCount++
      }
    }
    const useMessagesService = defineStore({ servicePath: 'messages', Model: Message })
    const messagesService = useMessagesService(pinia)

    // Test
    const message = (await new Message({ text: 'Here I am!' }).addToStore().clone()) as Message
    expect(runCount).toBe(1)
  })

  test('constructor runs only once when calling new Model().addToStore().clone().commit()', async () => {
    let runCount = 0
    // Setup
    class Message extends BaseModel {
      _id: number
      text = 'foo'
      constructor(data: Partial<Message>, options: Record<string, any> = {}) {
        super(data, options)
        this.init(data)
        runCount++
      }
    }
    const useMessagesService = defineStore({ servicePath: 'messages', Model: Message })
    const messagesService = useMessagesService(pinia)

    // Test
    const message = (await new Message({ text: 'Here I am!' }).addToStore().clone().commit()) as Message
    expect(runCount).toBe(1)
  })
})
