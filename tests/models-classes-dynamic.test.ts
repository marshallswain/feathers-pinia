import { createPinia } from 'pinia'
import { setup, models } from '../src/index'
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

  test('registering a model adds it to the models object', () => {
    console.log(models)
    expect(models).toHaveProperty('api')
    expect(models.api).toHaveProperty('Message')
  })

  test('create local instance', () => {
    const message = messagesService.add({ text: 'this is a test' })
  })
})
