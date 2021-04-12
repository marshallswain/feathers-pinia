import { createPinia } from 'pinia'
import { setup } from '../src/index'
import { api } from './feathers'

const pinia = createPinia()

const { defineStore, BaseModel } = setup({ pinia, clients: { api } })

const servicePath = 'messages'
const useMessagesService = defineStore({ servicePath })

const messagesService = useMessagesService()

const resetStore = () => (api.service('messages').store = {})
beforeAll(() => resetStore())
beforeAll(() => resetStore())

describe('DynamicBaseModel', () => {
  test('records are instances of provided class', async () => {
    const message = await messagesService.create({ text: 'Quick, what is the number to 911?' })
    expect(message.constructor.name).toBe('DynamicBaseModel')
  })
})
