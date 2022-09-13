import { createPinia } from 'pinia'
import { setupFeathersPinia } from '../src/index'
import { api } from './feathers'
import { resetStores } from './test-utils'

const pinia = createPinia()

const { defineStore, BaseModel } = setupFeathersPinia({ clients: { api } })

class Message extends BaseModel {
  _id: number
}
const servicePath = 'alt-ids'
const useMessages = defineStore({ servicePath, Model: Message, idField: '_id' })
const altIdStore = useMessages(pinia)

const reset = () => resetStores(api.service('messages'), altIdStore)

describe('Model Instances', () => {
  beforeEach(() => reset())
  afterEach(() => reset())

  test('creating an instance does NOT add it to the altIdStore', () => {
    new Message({ _id: 0, text: 'this is a test' })

    expect(altIdStore.itemsById[0]).toBeUndefined()
    expect(altIdStore.tempsById[0]).toBeUndefined()
  })

  test('calling instance.addToStore() adds it to itemsById when the data contains an id', () => {
    const message = new Message({ _id: 0, text: 'this is a test' })

    message.addToStore()

    expect(altIdStore.itemsById[0]).toBeTruthy()
  })

  test('calling instance.addToStore() adds it to tempsById when the record contains no id', () => {
    const message = new Message({ text: 'this is a test' })

    message.addToStore()

    expect(altIdStore.itemsById[0]).toBeUndefined()
    expect(Object.keys(altIdStore.tempsById)).toHaveLength(1)
  })

  test('new instances have truthy __isTemp', () => {
    const message = new Message({ text: 'this is a test' })

    expect(message.__isTemp).toBeTruthy
    message.addToStore()
    expect(message.__isTemp).toBeFalsy
  })

  describe('_id after create', () => {
    test('non-reactive records have id after save', async () => {
      const message = new Message({ text: 'this is a test' })
      await message.save()
      expect(message._id).toBeDefined()
    })
  })
})
