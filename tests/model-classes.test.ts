import { createPinia } from 'pinia'
import { setup } from '../src/index'
import { api } from './feathers'

const pinia = createPinia()

const { defineStore, BaseModel } = setup({ pinia, clients: { api } })

class Message extends BaseModel {}

const servicePath = 'messages'
const useMessagesService = defineStore({ servicePath, Model: Message })

const messagesService = useMessagesService()

const resetStore = () => (api.service('messages').store = {})
beforeAll(() => resetStore())
beforeAll(() => resetStore())

describe('Model Class', () => {
  test('records are instances of DynamicBaseModel', async () => {
    const message = await messagesService.create({ text: 'Quick, what is the number to 911?' })
    expect(message.constructor.name).toBe('Message')
  })
})
