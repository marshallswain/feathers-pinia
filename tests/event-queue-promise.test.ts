import {
  useQueuePromise,
  makeGetterName,
  makeState,
  resetState
} from '../src/service-store/event-queue-promise'
import { computed } from 'vue-demi'
import { createPinia } from 'pinia'
import { setupFeathersPinia } from '../src/index'
import { api } from './feathers'
import { resetStores, timeout } from './test-utils'

const pinia = createPinia()

const { defineStore, BaseModel } = setupFeathersPinia({ clients: { api } })

class Message extends BaseModel { }
const useMessagesService = defineStore({ servicePath: 'messages', Model: Message })
const messagesService = useMessagesService(pinia)

const reset = () => resetStores(api.service('messages'), messagesService)

describe('Event Queue Promises', () => {
  beforeEach(() => {
    resetState()
  })
  test('makeGetterName', () => {
    expect(makeGetterName('created')).toBe('isCreatePending')
  })
  test('makeState', () => {
    expect(makeState('created')).toStrictEqual({
      promise: null,
      isResolved: false,
      getter: 'isCreatePending'
    })
  })

  test('returns a promise', () => {
    expect(useQueuePromise(messagesService, 'created').then).toBeTruthy()
  })

  test('the promise resolves when the isPending state is false', async () => {
    messagesService.setPendingById(0, 'create', true)
    const promise = useQueuePromise(messagesService, 'created')
    promise.then((isResolved: boolean) => {
      expect(isResolved).toBeTruthy()
    })

    messagesService.setPendingById(0, 'create', false)

    return promise
  })

  test('returns the same unresolved promise', async () => {
    messagesService.setPendingById(0, 'create', true)
    const promise = useQueuePromise(messagesService, 'created')
    const promise2 = useQueuePromise(messagesService, 'created')
    expect(promise === promise2).toBeTruthy()
    messagesService.setPendingById(0, 'create', false)
  })

  test('returns a new promise after the other one resolves', async () => {
    messagesService.setPendingById(0, 'create', true)
    const promise = useQueuePromise(messagesService, 'created')

    messagesService.setPendingById(0, 'create', false)
    await timeout(100)
    const promise2 = useQueuePromise(messagesService, 'created')
    expect(promise && promise2 && promise != promise2).toBeTruthy()
  })
})
