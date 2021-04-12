import { createPinia } from 'pinia'
import { setup } from '../src/index'
import { api } from './feathers'

const pinia = createPinia()

const { defineStore, BaseModel } = setup({ pinia, clients: { api } })

class Message extends BaseModel {
  text = ''
}

const servicePath = 'messages'
const useMessagesService = defineStore({ servicePath, Model: Message })

const messagesService = useMessagesService()

const resetStore = () => (api.service('messages').store = {})
beforeAll(() => resetStore())
beforeAll(() => resetStore())

describe('Model Instance Defaults done on the Class level', () => {
  test('instances get default values from the class definition', async () => {
    const message = await messagesService.create({})
    expect(message.text).toBe('')
  })
})
