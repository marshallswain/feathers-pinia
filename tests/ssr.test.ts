import { ref, reactive } from 'vue-demi'
import { createPinia } from 'pinia'
import { setupFeathersPinia } from '../src/index'
import { api } from './feathers'
import { Params, QueryInfo } from '../src/types'
import { getQueryInfo } from '../src/utils'

const resetStore = () => (api.service('messages').store = {})

describe('server side rendering', () => {
  beforeEach(() => resetStore())

  test('find returns ssr data instead of making a duplicate request', async () => {
    const isSsr = ref(true)
    const pinia = createPinia()

    const { defineStore, BaseModel } = setupFeathersPinia({
      ssr: isSsr,
      clients: { api },
    })

    class Message extends BaseModel {
      static modelName = 'Message'
    }

    const servicePath = 'messages'
    const useMessagesService = defineStore({ servicePath, Model: Message })

    const messagesService = useMessagesService(pinia)

    const totalItems = 7
    const pageLimit = 2
    await messagesService.create({ text: 'Send me few random numbers' }) //1
    await messagesService.create({ text: '2389' }) //2
    await messagesService.create({ text: '2390' }) //3
    await messagesService.create({ text: '2391' }) //4
    await messagesService.create({ text: '2392' }) //5
    await messagesService.create({ text: '2393' }) //6
    await messagesService.create({ text: 'How are these random!' }) //7

    const pagination = reactive({
      $limit: pageLimit,
      $skip: 0,
    })
    const params: Params = {
      query: pagination,
      paginate: true,
    }
    const ssrResult = await Message.find(params)
    const queryInfo = getQueryInfo(params, ssrResult)
    const { qid, queryId, pageId } = queryInfo
    const pageData = messagesService.pagination[qid][queryId][pageId as string]

    expect(pageData.ssr).toBeTruthy()

    isSsr.value = false

    const clientResult = await Message.find(params)

    expect(clientResult.fromSsr).toBeTruthy()
    expect(clientResult.total).toBe(totalItems)
    expect(clientResult.data.length).toBe(pageLimit)
    expect(clientResult.limit).toBe(pageLimit)
    expect(clientResult.skip).toBe(0)
    expect(pageData.ssr).toBeFalsy()
  })

  test('can use params.preserveSsr to reuse ssr queries', async () => {
    const isSsr = ref(true)
    const pinia = createPinia()

    const { defineStore, BaseModel } = setupFeathersPinia({
      ssr: isSsr,
      clients: { api },
    })

    class Message extends BaseModel {
      static modelName = 'Message'
    }

    const servicePath = 'messages'
    const useMessagesService = defineStore({ servicePath, Model: Message })

    const messagesService = useMessagesService(pinia)

    const pageLimit = 2
    await messagesService.create({ text: 'Send me few random numbers' }) //1
    await messagesService.create({ text: '2389' }) //2
    await messagesService.create({ text: '2390' }) //3
    await messagesService.create({ text: '2391' }) //4
    await messagesService.create({ text: '2392' }) //5
    await messagesService.create({ text: '2393' }) //6
    await messagesService.create({ text: 'How are these random!' }) //7

    const pagination = reactive({
      $limit: pageLimit,
      $skip: 0,
    })
    const params: Params = {
      query: pagination,
      paginate: true,
    }
    const ssrResult = await Message.find(params)
    const queryInfo: QueryInfo = getQueryInfo(params, ssrResult)
    const { qid, queryId, pageId } = queryInfo
    const pageData = messagesService.pagination[qid][queryId][pageId as string]

    expect(pageData.ssr).toBeTruthy()

    isSsr.value = false

    params.preserveSsr = true
    const clientResult1 = await Message.find(params)
    expect(pageData.ssr).toBeTruthy()
    expect(clientResult1.data.length).toBe(2)
    expect(clientResult1.fromSsr).toBeTruthy()

    params.preserveSsr = false
    const clientResult2 = await Message.find(params)
    const pageData2 = messagesService.pagination[qid][queryId][pageId as string]
    expect(pageData2.ssr).toBeFalsy()
    expect(clientResult2.data.length).toBe(2)
  })
})
