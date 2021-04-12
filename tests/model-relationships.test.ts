import { createPinia } from 'pinia'
import { setup } from '../src/index'
import { api } from './feathers'

const pinia = createPinia()

const { defineStore, BaseModel } = setup({ pinia, clients: { api } })

class Message extends BaseModel {}
const useMessagesService = defineStore({ servicePath: 'messages', Model: Message })
const messagesService = useMessagesService()

class User extends BaseModel {
  instanceDefaults(data: any) {
    return {
      id: null,
      name: 'Amogh Palnitkar',
    }
  }
  get messages() {
    const messagesService = useMessagesService()
    const messages = messagesService.findInStore({ query: { userId: (this as any).id } }).data
    return messages
  }
}
const useUsersService = defineStore({ servicePath: 'users', Model: User })
const usersService = useUsersService()

let amogh: any

const resetStore = () => {
  api.service('messages').store = {}
  api.service('users').store = {}
}
beforeAll(async () => {
  resetStore()
  amogh = await usersService.create({ name: 'Amogh Palnitkar' })

  await Promise.all([
    messagesService.create({ text: 'message 1', userId: amogh.id }),
    messagesService.create({ text: 'message 2', userId: amogh.id }),
    messagesService.create({ text: 'message 3', userId: amogh.id }),
  ])
})
afterAll(() => resetStore())

describe('Model Relationships', () => {
  test('Access composed stores through es5 getters', async () => {
    expect(amogh.messages.length).toBe(3)
  })
})
