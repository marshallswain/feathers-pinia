import { computed } from 'vue'
import { createPinia } from 'pinia'
import { setup } from '../src/index'
import { api } from './feathers'
import { resetStores } from './test-utils'

const pinia = createPinia()

const { defineStore, BaseModel } = setup({ pinia, clients: { api } })

describe('Custom Actions', () => {
  test('adds custom actions to the store', async () => {
    const test = jest.fn()
    class Message extends BaseModel {}
    const useMessagesService = defineStore({
      servicePath: 'messages',
      Model: Message,
      actions: { test },
    })
    const messagesService = useMessagesService()

    messagesService.test()

    expect(test).toHaveBeenCalled()
  })
})
