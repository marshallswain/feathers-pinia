import { computed, ref } from 'vue'
import { createPinia } from 'pinia'
import { setup, models } from '../src/index'
import { api } from './feathers'
import { resetStores, timeout } from './test-utils'
import { useGet } from '../src'

const pinia = createPinia()

const { defineStore, BaseModel } = setup({ pinia, clients: { api } })

class Message extends BaseModel {
  static modelName = 'Message'
}

const servicePath = 'messages'
const useMessagesService = defineStore({ servicePath, Model: Message })

const messagesService = useMessagesService()

const reset = () => resetStores(api.service('messages'), messagesService)

describe('useGet', () => {
  beforeEach(() => reset())
  afterEach(() => reset())

  test('returns correct data object', async () => {
    const id = computed(() => 0)
    const data = useGet({ id, model: Message })

    expect(data.error.value).toBe(null)
    expect(typeof data.get).toBe('function')
    expect(data.hasBeenRequested.value).toBe(true)
    expect(data.hasLoaded.value).toBe(false)
    expect(data.isLocal.value).toBe(false)
    expect(data.isPending.value).toBe(true)
    expect(data.item.value).toBe(null)
    expect(data.servicePath.value).toBe('messages')
  })

  test('item is returned', async () => {
    const id = computed(() => 0)
    const data = useGet({ id, model: Message })

    await messagesService.create({ id: 0, text: 'Test Message' })

    expect(data.item.value.id).toBe(0)
  })

  test('use queryWhen', async () => {
    const id = 0
    await messagesService.create({ text: 'yo!', id })
    const now = ref(false)
    const queryWhen = computed(() => now.value)
    const data = useGet({ id, model: Message, queryWhen })

    expect(data.hasBeenRequested.value).toBe(false)

    now.value = true
    await timeout(200)

    expect(data.hasBeenRequested.value).toBe(true)
  })

  test('use {immediate:false} to not query immediately', async () => {
    const id = 0
    const data = useGet({ id, model: Message, immediate: false })

    expect(data.hasBeenRequested.value).toBe(false)
  })
})
