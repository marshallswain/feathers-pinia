import { computed, ref } from 'vue-demi'
import { createPinia } from 'pinia'
import { setupFeathersPinia, useFind } from '../src/index'
import { api } from './feathers'
import { resetStores, timeout } from './test-utils'
import { QueryWhenContext, QueryWhenFunction } from '../src/service-store/types'

function createTestContext() {
  const pinia = createPinia()

  const { defineStore, BaseModel } = setupFeathersPinia({ clients: { api } })

  class Message extends BaseModel {
    static modelName = 'Message'
  }

  const servicePath = 'messages'
  const useMessagesService = defineStore({ servicePath, Model: Message })

  const messagesService = useMessagesService(pinia)

  const reset = () => resetStores(api.service('messages'), messagesService)

  return { pinia, defineStore, BaseModel, Message, messagesService, reset }
}

describe('useFind', () => {
  describe('pagination off', () => {
    beforeEach(() => {
      const { reset } = createTestContext()
      reset()
    })
    afterEach(() => {
      const { reset } = createTestContext()
      reset()
    })

    test('returns correct data', async () => {
      const { Message } = createTestContext()

      const params = computed(() => ({ query: {} }))
      const data = useFind({ params, model: Message })

      expect(data.debounceTime.value).toBe(null)
      expect(data.error.value).toBe(null)
      expect(typeof data.find).toBe('function')
      expect(data.haveBeenRequested.value).toBe(true)
      expect(data.haveLoaded.value).toBe(false)
      expect(data.isLocal.value).toBe(false)
      expect(data.isPending.value).toBe(true)
      expect(data.items.value.length).toBe(0)
      expect(data.latestQuery.value).toBe(null)
      expect(data.paginationData.value).toBeDefined()
      expect(data.qid.value).toBe('default')
      expect(data.servicePath.value).toBe('messages')
      expect(data.isSsr.value).toBe(false)
      expect((data.request.value as any).then)
    })

    test('reactive data works correctly', async () => {
      const { Message, messagesService } = createTestContext()
      const params = computed(() => ({ query: {} }))
      const data = useFind({ params, model: Message })

      expect(data.items.value.length).toBe(0)

      await messagesService.create({ text: 'yo!' })

      expect(data.items.value.length).toBe(1)
    })

    test('use params', async () => {
      const { Message, messagesService } = createTestContext()

      await messagesService.create({ text: 'yo!', messageTo: 'marshall' })
      const params = computed(() => ({ query: { messageTo: 'marshall' } }))
      const data = useFind({ params, model: Message })

      expect(data.items.value.length).toBe(1)
      expect(data.items.value[0].messageTo).toBe('marshall')
    })

    test('use queryWhen', async () => {
      const { Message, messagesService } = createTestContext()

      await messagesService.create({ text: 'yo!' })
      const params = computed(() => ({ query: {} }))
      const isReady = ref(false)
      const queryWhen = computed(() => isReady.value)
      const data = useFind({ params, model: Message, queryWhen })

      expect(data.haveBeenRequested.value).toBe(false)

      isReady.value = true
      await timeout(200)

      expect(data.haveBeenRequested.value).toBe(true)
    })

    test('queryWhen can return a function', async () => {
      const { Message, messagesService } = createTestContext()

      await messagesService.create({ text: 'yo!' })
      const params = computed(() => ({ query: { $limit: 10, $skip: 0 } }))
      const isReady = ref(false)
      const queryWhenFunction = jest.fn((context: QueryWhenContext) => {
        expect(context.items.value)
        expect(context.queryInfo)
        expect(context.qidData)
        expect(context.queryData)
        expect(context.pageData)
        return isReady.value
      })
      const queryWhen: QueryWhenFunction = computed(() => queryWhenFunction)
      const data = useFind({ params, model: Message, queryWhen })

      expect(queryWhenFunction).toHaveBeenCalledTimes(1)

      isReady.value = true
      await timeout(200)

      expect(queryWhenFunction).toHaveBeenCalledTimes(4)

      expect(data.haveBeenRequested.value).toBe(true)
    })

    test('use {immediate:false} to not query immediately', async () => {
      const { Message } = createTestContext()

      const params = computed(() => ({ query: {} }))
      const data = useFind({ params, model: Message, immediate: false })

      expect(data.haveBeenRequested.value).toBe(false)
    })
  })

  describe('pagination on', () => {
    beforeAll(() => {
      const messagesService = api.service('messages')
      messagesService.options.paginate = {
        default: 10,
        max: 100,
      }
    })
    beforeEach(() => {
      const { reset } = createTestContext()
      reset()
    })
    afterEach(() => {
      const { reset } = createTestContext()
      reset()
    })

    test('reactive data works correctly', async () => {
      const { Message, messagesService } = createTestContext()

      const params = computed(() => ({ query: {} }))
      const data = useFind({ params, model: Message })

      expect(data.items.value.length).toBe(0)

      await messagesService.create({ text: 'yo!' })

      expect(data.items.value.length).toBe(1)
    })

    test('pagination data updates', async () => {
      const { Message } = createTestContext()

      const params = computed(() => ({ query: {} }))
      const data = useFind({ params, model: Message })

      expect(data.items.value.length).toBe(0)

      await timeout(200)

      expect(data.paginationData.value.default).toHaveProperty('{}')
      expect(data.paginationData.value.default).toHaveProperty('mostRecent')
      expect(data.paginationData.value.defaultLimit).toBe(10)
      expect(data.paginationData.value.defaultSkip).toBe(0)
      expect(data.latestQuery.value).toBeTruthy()
    })

    test('use params', async () => {
      const { Message, messagesService } = createTestContext()

      await messagesService.create({ text: 'yo!', messageTo: 'marshall' })
      const params = computed(() => ({ query: { messageTo: 'marshall' } }))
      const data = useFind({ params, model: Message })

      expect(data.items.value.length).toBe(1)
      expect(data.items.value[0].messageTo).toBe('marshall')
    })
  })

  describe('set pagination via params', () => {
    beforeEach(() => {
      const { reset } = createTestContext()
      reset()
    })
    afterEach(() => {
      const { reset } = createTestContext()
      reset()
    })

    test('paginated data returns as per query params', async () => {
      const { Message, messagesService } = createTestContext()

      await messagesService.create({ text: 'test #1' })
      await messagesService.create({ text: 'test #2' })
      await messagesService.create({ text: 'test #3' })
      await messagesService.create({ text: 'test #4' })
      const params = computed(() => ({
        query: { $skip: 0, $limit: 2 },
      }))
      const data = useFind({ params, model: Message })

      expect(data.items.value.length).toBe(2)
    })
  })
})
