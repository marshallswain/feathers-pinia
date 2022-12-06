import { computed } from 'vue-demi'
import { createPinia } from 'pinia'
import { setupFeathersPinia } from '../../src/index'
import { api } from '../feathers'
import { resetStores } from '../test-utils'

const pinia = createPinia()

const { defineStore, BaseModel } = setupFeathersPinia({ clients: { api } })

class Message extends BaseModel {}
const useMessagesService = defineStore({ servicePath: 'messages', Model: Message })
const messagesService = useMessagesService(pinia)

const reset = () => resetStores(api.service('messages'), messagesService)

describe('Hydration', () => {
  beforeEach(async () => {
    reset()
    // Manually load a few plain js objects into the store.
    '......'.split('.').forEach((empty: string, id: number) => {
      const message = { id, text: 'hydrate me' }
      //@ts-expect-error simulating ssr data
      messagesService.itemsById[id] = message
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

    Message.findInStore({ query: { id: { $lte: 3 } } })

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

    Message.getFromStore(0)

    expect(message0.value instanceof Message).toBe(true)
    // other items were not hydrated.
    expect(message1.value instanceof Message).toBe(false)
  })

  test('hydrate an entire store with hydrateAll', () => {
    const message0 = computed(() => messagesService.itemsById[0])
    const message6 = computed(() => messagesService.itemsById[6])

    expect(message0.value instanceof Message).toBe(false)
    expect(message6.value instanceof Message).toBe(false)

    messagesService.hydrateAll()

    expect(message0.value instanceof Message).toBe(true)
    expect(message6.value instanceof Message).toBe(true)
  })
})
