import { createPinia } from 'pinia'
import { setup } from '../src/index'
import { api } from './feathers'
import { resetStores } from './test-utils'

const pinia = createPinia()

const { defineStore, BaseModel } = setup({ pinia, clients: { api } })

class Message extends BaseModel {}
const servicePath = 'messages'
const useMessages = defineStore({ servicePath, Model: Message })

const messagesStore = useMessages()

const reset = () => resetStores(api.service('messages'), messagesStore)

describe('Model Instances', () => {
  beforeEach(() => reset())
  afterEach(() => reset())

  test('creating an instance does NOT add it to the messagesStore', () => {
    new Message({ id: 0, text: 'this is a test' })

    expect(messagesStore.itemsById[0]).toBeUndefined()
    expect(messagesStore.tempsById[0]).toBeUndefined()
  })

  test('calling instance.addToStore() adds it to itemsById when the data contains an id', () => {
    const message = new Message({ id: 0, text: 'this is a test' })

    message.addToStore()

    expect(messagesStore.itemsById[0]).toBeTruthy()
  })

  test('calling instance.addToStore() adds it to tempsById when the record contains no id', () => {
    const message = new Message({ text: 'this is a test' })

    message.addToStore()

    expect(messagesStore.itemsById[0]).toBeUndefined()
    expect(Object.keys(messagesStore.tempsById)).toHaveLength(1)
  })
})
