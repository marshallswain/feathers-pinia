import { computed } from 'vue'
import { createPinia } from 'pinia'
import { setup } from '../src/index'
import { api } from './feathers'
import { resetStores, timeout } from './test-utils'
import { useFind } from '../src/use-find'

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

  test('supports useFind as a customAction', async () => {
    class Message extends BaseModel {}
    const useMessagesService = defineStore({
      servicePath: 'messages',
      Model: Message,
      actions: {
        findMessages(params: any) {
          return useFind({ params, model: this })
        },
      },
    })
    const messagesService = useMessagesService()

    const params = computed(() => ({ query: { text: 'this is a test' }, temps: true }))
    const data = messagesService.findMessages(params)

    expect(data.items.value).toHaveLength(0)

    messagesService.add({ text: 'this is a test' })

    await timeout(100)

    expect(data.items.value).toHaveLength(1)
  })

  test('custom actions are added to the model class', () => {
    class Message extends BaseModel {
      static test: Function
    }
    const useMessagesService = defineStore({
      servicePath: 'messages',
      Model: Message,
      actions: {
        test() {
          const store: any = this
          store.idField = 'moose'
        },
      },
    })
    const messagesService = useMessagesService()

    Message.test()

    expect(messagesService.idField).toBe('moose')
  })
})
