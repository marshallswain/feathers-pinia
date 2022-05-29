import { computed, ref, reactive } from 'vue-demi'
import { createPinia } from 'pinia'
import { setupFeathersPinia } from '../src/index'
import { api } from './feathers'
import { timeout } from './test-utils'
import { useFind } from '../src/use-find'
import { usePagination } from '../src/use-pagination'

const pinia = createPinia()

const { defineStore, BaseModel } = setupFeathersPinia({ clients: { api } })

class Message extends BaseModel {
  static modelName = 'Message'
}

const servicePath = 'messages'
const useMessagesService = defineStore({ servicePath, Model: Message })

const messagesService = useMessagesService(pinia)

const resetStore = () => {
  api.service('messages').store = {}
}

describe('usePagination', () => {
  beforeEach(() => resetStore())

  test('returns correct data with ref', async () => {
    const totalItems = 7
    const pageLimit = 2
    await messagesService.create({ text: 'Send me few random numbers' }) //1
    await messagesService.create({ text: '2389' }) //2
    await messagesService.create({ text: '2390' }) //3
    await messagesService.create({ text: '2391' }) //4
    await messagesService.create({ text: '2392' }) //5
    await messagesService.create({ text: '2393' }) //6
    await messagesService.create({ text: 'How are these random!' }) //7

    const pagination = ref({
      $limit: pageLimit,
      $skip: 0,
    })
    const params = computed(() => {
      const query = {}
      Object.assign(query, pagination.value)
      return { query, paginate: true }
    })
    const { latestQuery } = useFind({ model: Message, params })

    await timeout(200)

    const { currentPage, pageCount, next, canNext, canPrev } = usePagination(
      pagination,
      latestQuery,
    )
    expect(currentPage.value).toBe(1)
    expect(pageCount.value).toBe(Math.ceil(totalItems / pageLimit))
    expect(canNext.value).toBeTruthy()
    expect(canPrev.value).toBeFalsy()

    next()

    expect(currentPage.value).toBe(2)
    expect(canNext.value).toBeTruthy()
    expect(canPrev.value).toBeTruthy()
  })

  test('returns correct data with reactive', async () => {
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
    const params = computed(() => {
      const query = {}
      Object.assign(query, pagination)
      return { query, paginate: true }
    })
    const { latestQuery } = useFind({ model: Message, params })

    await timeout(200)

    const { currentPage, itemsCount, pageCount, next, canNext, canPrev } = usePagination(
      pagination,
      latestQuery,
    )
    expect(currentPage.value).toBe(1)
    expect(itemsCount.value).toBe(totalItems)
    expect(pageCount.value).toBe(Math.ceil(totalItems / pageLimit))
    expect(canNext.value).toBeTruthy()
    expect(canPrev.value).toBeFalsy()

    next()

    expect(currentPage.value).toBe(2)
    expect(canNext.value).toBeTruthy()
    expect(canPrev.value).toBeTruthy()
  })
})
