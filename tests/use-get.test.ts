import { computed, ref } from 'vue-demi'
import { createPinia } from 'pinia'
import { setupFeathersPinia, models } from '../src/index'
import { api } from './feathers'
import { resetStores, timeout } from './test-utils'
import { useGet } from '../src'

const pinia = createPinia()

const { defineStore, BaseModel } = setupFeathersPinia({ clients: { api } })

class Message extends BaseModel {
  static modelName = 'Message'
}

const servicePath = 'messages'
const useMessagesService = defineStore({ servicePath, Model: Message })

const messagesService = useMessagesService(pinia)

const reset = () => resetStores(api.service('messages'), messagesService)

describe('useGet', () => {
  beforeEach(() => reset())
  afterEach(() => reset())

  test('returns correct data', async () => {
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

  test('null id with params', async () => {
    const id = ref(null)
    const data = useGet({ id, model: Message })

    await messagesService.create({ id: 0, text: 'Test Message' })

    expect(data.item.value).toBe(null)
  })

  test('use queryWhen', async () => {
    const id = ref(0)
    await messagesService.create({ text: 'yo!', id })
    const isReady = ref(false)
    const queryWhen = computed(() => isReady.value)
    const data = useGet({ id, model: Message, queryWhen })

    expect(data.hasBeenRequested.value).toBe(false)

    isReady.value = true
    await timeout(200)

    expect(data.hasBeenRequested.value).toBe(true)
  })

  test('use {immediate:false} to not query immediately', async () => {
    const id = ref(0)
    const data = useGet({ id, model: Message, immediate: false })

    expect(data.hasBeenRequested.value).toBe(false)
  })
})
