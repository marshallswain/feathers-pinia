import { createPinia } from 'pinia'
import { setupFeathersPinia, models } from '../src/index'
import { api } from './feathers'

const pinia = createPinia()

const { defineStore } = setupFeathersPinia({ clients: { api } })

const servicePath = 'messages'
const useMessagesService = defineStore({ servicePath })

const messagesService = useMessagesService(pinia)

const resetStore = () => (api.service('messages').store = {})
beforeAll(() => resetStore())
afterAll(() => resetStore())

describe('DynamicBaseModel', () => {
  test('records are instances of provided class', async () => {
    const message = await messagesService.create({
      text: 'Quick, what is the number to 911?',
    })
    expect(message.constructor.name).toBe('DynamicBaseModel')
  })

  test('registering a model adds it to the models object', () => {
    expect(models).toHaveProperty('api')
    expect(models.api).toHaveProperty('messages')
  })

  test('create local instance', () => {
    messagesService.addToStore({ text: 'this is a test' })
  })
})
