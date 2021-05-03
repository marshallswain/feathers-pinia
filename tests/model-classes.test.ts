import { createPinia } from 'pinia'
import { setup, models } from '../src/index'
import { api } from './feathers'

const pinia = createPinia()

const { defineStore, BaseModel } = setup({ pinia, clients: { api } })

class Message extends BaseModel {
  static modelName = 'Message'
}

const servicePath = 'messages'
const useMessagesService = defineStore({ servicePath, Model: Message })

const messagesService = useMessagesService()

const resetStore = () => (api.service('messages').store = {})

describe('Model Class', () => {
  beforeAll(() => resetStore())
  afterAll(() => resetStore())

  test('records are instances of DynamicBaseModel', async () => {
    const message = await messagesService.create({ text: 'Quick, what is the number to 911?' })
    expect(message.constructor.name).toBe('Message')
  })

  test('registering a model adds it to the models object', () => {
    expect(models).toHaveProperty('api')
    expect(models.api).toHaveProperty('Message')
  })
})
