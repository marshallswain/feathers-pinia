import { createPinia } from 'pinia'
import { setupFeathersPinia } from '../src/index'
import { api } from './feathers'
import { resetStores } from './test-utils'

const pinia = createPinia()

const { defineStore, BaseModel } = setupFeathersPinia({ clients: { api } })

class Message extends BaseModel {
  id: number
}
const servicePath = 'messages'
const useMessages = defineStore({ servicePath, Model: Message })

const messagesStore = useMessages(pinia)

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

  test('new instances have truthy __isTemp', () => {
    const message = new Message({ text: 'this is a test' })

    expect(message.__isTemp).toBeTruthy
    message.addToStore()
    expect(message.__isTemp).toBeFalsy
  })

  describe('id after create', () => {
    test('non-reactive records have id after save', async () => {
      const message = new Message({ text: 'this is a test' })
      await message.save()
      expect(message.id).toBeDefined()
    })
  })

  describe('Saved Attributes', async () => {
    test('__isClone is not included when serializing for the API', async () => {
      let had__isClone = false
      const message = new Message({ text: 'this is a test' }).addToStore() as Message

      const hook = (context) => {
        if (Object.prototype.hasOwnProperty.call(context.data, '__isClone')) {
          had__isClone = true
        }
        return context
      }
      api.service('messages').hooks({ before: { create: [hook] } })
      await message.save()
      expect(had__isClone).toBeFalsy()
    })

    test('__isTemp is not included when serializing for the API', async () => {
      let had__isTemp = false
      const message = new Message({ text: 'this is a test' }).addToStore() as Message

      const hook = (context) => {
        if (Object.prototype.hasOwnProperty.call(context.data, '__isTemp')) {
          had__isTemp = true
        }
        return context
      }
      api.service('messages').hooks({ before: { create: [hook] } })

      await message.save()
      expect(had__isTemp).toBeFalsy()
    })

    test('the tempIdField is removed by the cleanData util when serializing for the API', async () => {
      let hadTempIdField = false
      const message = new Message({ text: 'this is a test' }).addToStore() as Message

      const hook = (context) => {
        if (Object.prototype.hasOwnProperty.call(context.data, message.Model.tempIdField)) {
          hadTempIdField = true
        }
        return context
      }
      api.service('messages').hooks({ before: { create: [hook] } })
      await message.save()
      expect(hadTempIdField).toBeFalsy()
    })
  })
})
