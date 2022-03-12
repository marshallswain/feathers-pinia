import { createPinia } from 'pinia'
import { setupFeathersPinia } from '../src/index'
import { api } from './feathers'
import { resetStores } from './test-utils'

const pinia = createPinia()

const { defineStore, BaseModel } = setupFeathersPinia({ clients: { api } })

class Message extends BaseModel {}
const useMessagesService = defineStore({ servicePath: 'messages', idField: 'id', Model: Message })
const messagesService = useMessagesService(pinia)

const reset = () => resetStores(api.service('messages'), messagesService)

describe('Lists', () => {
  beforeEach(async () => {
    reset()
    // Manually add some data to the store.
    '......'.split('.').forEach((empty: string, id: number) => {
      messagesService.addToStore({ id, text: 'hydrate me' })
      messagesService.addToStore({ text: `temp message ${id}` })
    })
  })
  afterEach(() => reset())

  test('items getter returns items in itemsById', async () => {
    expect(messagesService.items.length).toBe(7)
  })

  test('itemIds getter returns item ids in itemsById', async () => {
    messagesService.addToStore({ id: "507f1f77bcf86cd799439011", text: 'hydrate me' })
    expect(messagesService.itemIds).toStrictEqual([0, 1, 2, 3, 4, 5, 6, "507f1f77bcf86cd799439011"])
  });

  test('temps getter returns items in tempsById', async () => {
    expect(messagesService.temps.length).toBe(7)
  })

  test('tempIds getter returns temp ids in tempsById', async () => {
    const {tempIdField} = messagesService
    const tempIds = messagesService.temps.map((temp: any) => temp[tempIdField]);
    expect(messagesService.tempIds).toStrictEqual(tempIds)
  });

  test('clones getter returns clones in clonesById', async () => {
    messagesService.items.forEach((item: any) => item.clone())
    expect(messagesService.clones.length).toBe(7)
  })

  test('cloneIds getter returns clone ids in clonesById', async () => {
    messagesService.items.forEach((item: any) => item.clone())
    expect(messagesService.cloneIds).toStrictEqual([0, 1, 2, 3, 4, 5, 6])
  });
})
