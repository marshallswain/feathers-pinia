import { computed } from 'vue'
import { createPinia } from 'pinia'
import { setup } from '../src/index'
import { api } from './feathers'
import { resetStores } from './test-utils'
import { getItemsFromQueryInfo } from '../src/utils'

const pinia = createPinia()

const { defineStore, BaseModel } = setup({ pinia, clients: { api } })

class Message extends BaseModel {}
const useMessagesService = defineStore({ servicePath: 'messages', Model: Message })
const messagesService = useMessagesService()

const reset = () => resetStores(api.service('messages'), messagesService)

describe('Lists', () => {
  beforeEach(async () => {
    reset()
    // Manually add some data to the store.
    '......'.split('.').forEach((empty: string, id: number) => {
      messagesService.add({ id, text: 'hydrate me' })
      messagesService.add({ text: `temp message ${id}` })
    })
  })
  afterEach(() => reset())

  test('items getter returns items in itemsById', async () => {
    expect(messagesService.items.length).toBe(7)
  })

  test('temps getter returns items in tempsById', async () => {
    expect(messagesService.temps.length).toBe(7)
  })

  test('temps getter returns items in tempsById', async () => {
    messagesService.items.forEach((item: any) => item.clone())
    expect(messagesService.clones.length).toBe(7)
  })
})
