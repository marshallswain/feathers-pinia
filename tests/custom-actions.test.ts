import { computed } from 'vue-demi'
import { createPinia } from 'pinia'
import { setupFeathersPinia, defineStore } from '../src/index'
import { api } from './feathers'
import { timeout } from './test-utils'
import { useFind } from '../src/use-find'

describe('Custom Actions', () => {
  test('adds custom actions to the store', async () => {
    const { defineStore, BaseModel } = setupFeathersPinia({ clients: { api } })
    const pinia = createPinia()
    const test = jest.fn()
    class Message extends BaseModel {}
    const useMessagesService = defineStore({
      servicePath: 'messages',
      Model: Message,
      actions: { test },
    })
    const messagesService = useMessagesService(pinia)

    messagesService.test()

    expect(test).toHaveBeenCalled()
  })

  test('supports useFind as a customAction', async () => {
    const pinia = createPinia()
    const useMessagesService: any = defineStore({
      clients: { api },
      servicePath: 'messages',
      actions: {
        findMessages(params: any) {
          return useFind({ params, model: this })
        },
      },
    })
    const messagesService: any = useMessagesService(pinia)

    const params = computed(() => ({ query: { text: 'this is a test' }, temps: true }))
    const data = messagesService.findMessages(params)

    expect(data.items.value).toHaveLength(0)

    messagesService.addToStore({ text: 'this is a test' })

    await timeout(100)

    expect(data.items.value).toHaveLength(1)
  })

  test('custom actions are added to the model class', () => {
    const { defineStore, BaseModel } = setupFeathersPinia({ clients: { api } })
    const pinia = createPinia()
    class Message extends BaseModel {
      static test: Function
    }
    const useMessagesService = defineStore({
      servicePath: 'messages',
      Model: Message,
      actions: {
        test() {
          this.idField = 'moose'
        },
      },
    })
    const messagesService = useMessagesService(pinia)

    Message.test()

    expect(messagesService.idField).toBe('moose')
  })
})
