import { computed } from 'vue'
import { createPinia } from 'pinia'
import { setup } from '../src/index'
import { api } from './feathers'
import { resetStores } from './test-utils'

const pinia = createPinia()

const { defineStore, BaseModel } = setup({ pinia, clients: { api } })

class Message extends BaseModel {}
const useMessagesService = defineStore({ servicePath: 'messages', Model: Message })
const messagesService = useMessagesService()

const reset = () => resetStores(api.service('messages'), messagesService)

describe('Hydration', () => {
  beforeEach(async () => {
    reset()
    // Manually load a few plain js objects into the store.
    '......'.split('.').forEach((empty: string, id: number) => {
      const message = { id, text: 'hydrate me' }
      messagesService.itemsById[id] = message
      messagesService.ids.push(id)
    })
  })
  afterEach(() => reset())

  test('findInStore hydrates items into Model instances', async () => {
    const message0 = computed(() => messagesService.itemsById[0])
    const message3 = computed(() => messagesService.itemsById[3])
    const message4 = computed(() => messagesService.itemsById[4])

    expect(message0.value instanceof Message).toBe(false)
    expect(message3.value instanceof Message).toBe(false)
    expect(message4.value instanceof Message).toBe(false)

    const msg = Message.findInStore({ query: { id: { $lte: 3 } } })

    expect(message0.value instanceof Message).toBe(true)
    expect(message3.value instanceof Message).toBe(true)
    // items not matching the query were not hydrated
    expect(message4.value instanceof Message).toBe(false)
  })

  test('getFromStore hydrates items into Model instances', async () => {
    const message0 = computed(() => messagesService.itemsById[0])
    const message1 = computed(() => messagesService.itemsById[1])

    expect(message0.value instanceof Message).toBe(false)
    expect(message1.value instanceof Message).toBe(false)

    const msg = Message.getFromStore(0)

    expect(message0.value instanceof Message).toBe(true)
    // other items were not hydrated.
    expect(message1.value instanceof Message).toBe(false)
  })

  test('hydrate an entire store', () => {
    const message0 = computed(() => messagesService.itemsById[0])
    const message6 = computed(() => messagesService.itemsById[6])

    expect(message0.value instanceof Message).toBe(false)
    expect(message6.value instanceof Message).toBe(false)

    messagesService.add(messagesService.items)

    expect(message0.value instanceof Message).toBe(true)
    expect(message6.value instanceof Message).toBe(true)
  })
})
