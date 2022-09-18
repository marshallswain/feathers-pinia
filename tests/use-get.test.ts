import { setupFeathersPinia, BaseModel, Get, useGet } from '../src/index' // from 'feathers-pinia'
import { createPinia } from 'pinia'
import { api } from './feathers'
import { resetStores, timeout } from './test-utils'
import { ref } from 'vue-demi'
import { vi } from 'vitest'

const pinia = createPinia()
const { defineStore } = setupFeathersPinia({ clients: { api } })

export class Message extends BaseModel {
  id: number
  text: string

  constructor(data: Partial<Message>, options: Record<string, any> = {}) {
    super(data, options)
    this.init(data)
  }
}

const useMessagesService = defineStore({ servicePath: 'messages', Model: Message })
const messageStore = useMessagesService(pinia)

const reset = () => {
  resetStores(api.service('messages'), messageStore)
}

beforeEach(async () => {
  reset()
  api.service('messages').store = {
    1: { id: 1, text: 'Moose' },
    2: { id: 2, text: 'moose' },
    3: { id: 3, text: 'Goose' },
    4: { id: 4, text: 'Loose' },
    5: { id: 5, text: 'Marshall' },
    6: { id: 6, text: 'David' },
    7: { id: 7, text: 'Beau' },
    8: { id: 8, text: 'Batman' },
    9: { id: 9, text: 'Flash' },
    10: { id: 10, text: 'Wolverine' },
    11: { id: 11, text: 'Rogue' },
    12: { id: 12, text: 'Jubilee' },
  }
})
afterEach(() => reset())

describe('Factory Function', () => {
  test('can use `useGet` to get a Find instance', async () => {
    const returned = useGet(1, { store: messageStore })
    expect(returned instanceof Get).toBeTruthy()
    expect(returned.data.value).toBeDefined()
  })
})

describe('Get Class', () => {
  beforeEach(async () => {
    await messageStore.find({ query: { $limit: 20 } })
  })

  test('can pass a primitive id', async () => {
    const { data, requestCount } = new Get(1, { store: messageStore })
    expect(data.value?.id).toBe(1)
    expect(requestCount.value).toBe(0)
  })

  test('can pass a ref id', async () => {
    const id = ref(1)
    const { data } = new Get(id, { store: messageStore })
    expect(data.value?.id).toBe(1)
  })

  test('updating returned id updates data', async () => {
    const { id, data } = new Get(1, { store: messageStore })
    expect(id.value).toBe(1)
    expect(data.value?.id).toBe(1)

    id.value = 2

    expect(data.value?.id).toBe(2)
  })

  test('id can be null from store', async () => {
    const { id, data } = new Get(null, { store: messageStore })
    expect(id.value).toBe(null)
    expect(data.value).toBe(null)
  })
})

describe('Service Store', () => {
  beforeEach(async () => {
    await messageStore.find({ query: { $limit: 20 } })
  })

  test('works as client-only useGet', async () => {
    const id = ref(1)
    const { data, request, requestCount } = messageStore.useGet(id)
    await request.value
    expect(data.value?.id).toBe(1)
    expect(requestCount.value).toBe(0)
  })

  test('works with onServer', async () => {
    const id = ref(1)
    const { data, request, requestCount } = messageStore.useGet(id, { onServer: true })
    await request.value
    expect(data.value?.id).toBe(1)
    expect(requestCount.value).toBe(1)
  })
})

describe('With onServer', () => {
  test('can fetch data from the server', async () => {
    const id = ref(1)
    const { data, request, requestCount } = new Get(id, { store: messageStore, onServer: true })
    await request.value
    expect(data.value?.id).toBe(1)
    expect(requestCount.value).toBe(1)
  })

  test('watches id', async () => {
    const id = ref(1)
    const { data, request, isPending, hasLoaded, hasBeenRequested } = new Get(id, {
      store: messageStore,
      onServer: true,
    })
    expect(isPending.value).toBe(true)
    expect(hasLoaded.value).toBe(false)
    expect(hasBeenRequested.value).toBe(true)

    await request.value

    expect(isPending.value).toBe(false)
    expect(data.value?.id).toBe(1)

    id.value = 2
    await timeout(20)
    await request.value

    expect(data.value?.id).toBe(2)
  })

  test('id can be null with onServer', async () => {
    const { id, data, requestCount, get } = new Get(null, { store: messageStore, immediate: false, onServer: true })
    expect(id.value).toBe(null)
    expect(data.value).toBe(null)
    expect(requestCount.value).toBe(0)

    try {
      expect(await get()).toThrow()
    } catch (error) {
      expect(error).toBeTruthy()
    }
  })

  test('can show previous record while a new one loads', async () => {
    // A hook to cause a delay so we can check pending state
    let hookRunCount = 0
    const hook = async () => {
      if (hookRunCount < 2) {
        hookRunCount++
        await timeout(50)
      }
    }
    api.service('messages').hooks({ before: { get: [hook] } })

    const id = ref(1)
    const { data, request, isPending } = new Get(id, { store: messageStore, onServer: true })

    await request.value

    expect(isPending.value).toBe(false)
    expect(data.value?.id).toBe(1)

    id.value = 2

    await timeout(20)

    expect(isPending.value).toBe(true)
    expect(data.value?.id).toBe(1)

    await request.value

    expect(isPending.value).toBe(false)
    expect(data.value?.id).toBe(2)
  })

  test('can prevent a query with queryWhen', async () => {
    const id = ref(1)
    const { data, get, requestCount, queryWhen, request } = new Get(id, {
      store: messageStore,
      onServer: true,
      immediate: false,
    })
    const queryWhenFn = vi.fn(() => {
      return !data.value
    })
    queryWhen(queryWhenFn)
    expect(requestCount.value).toBe(0)

    await get()

    // queryWhen doesn't get called when you manually call `get`
    expect(queryWhenFn).not.toHaveBeenCalled()
    expect(requestCount.value).toBe(1)

    id.value = 2
    await timeout(20)
    await request.value

    expect(requestCount.value).toBe(2)

    id.value = 1
    await timeout(20)
    await request.value

    expect(requestCount.value).toBe(2)
    expect(queryWhenFn).toHaveBeenCalledTimes(2)
  })

  test('can disable watch', async () => {
    const id = ref(1)
    const { get, requestCount, request } = new Get(id, {
      store: messageStore,
      onServer: true,
      watch: false,
    })
    expect(requestCount.value).toBe(0)

    await get()

    expect(requestCount.value).toBe(1)

    id.value = 2
    await timeout(20)
    await request.value

    expect(requestCount.value).toBe(1)

    id.value = 1
    await timeout(20)
    await request.value

    expect(requestCount.value).toBe(1)
  })
})

describe('Errors', () => {
  test('sets and clears errors', async () => {
    // Throw an error in a hook
    let hasHookRun = false
    const hook = () => {
      if (!hasHookRun) {
        hasHookRun = true
        throw new Error('fail')
      }
    }
    api.service('messages').hooks({ before: { get: [hook] } })

    const { error, clearError, get } = new Get(1, { store: messageStore, onServer: true, immediate: false })
    expect(error.value).toBe(null)
    try {
      expect(await get()).toThrow()
    } catch (err: any) {
      expect(err.message).toBe('fail')
      expect(error.value.message).toBe('fail')

      clearError()

      expect(error.value).toBe(null)
    }
  })

  test('receives 404 from service if not found', async () => {
    const { data, error, clearError, get } = messageStore.useGet('A', { onServer: true, immediate: false })

    try {
      expect(await get()).toThrow()
    } catch (err: any) {
      expect(data.value).toBe(null)
      expect(err.message).toBe("No record found for id 'A'")
      expect(error.value.message).toBe("No record found for id 'A'")

      clearError()

      expect(error.value).toBe(null)
    }
  })
})
