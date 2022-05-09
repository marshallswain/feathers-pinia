import { watch, computed } from 'vue-demi'
import { createPinia } from 'pinia'
import { setupFeathersPinia } from '../src/index'
import { api } from './feathers'
import { resetStores } from './test-utils'
import { vi } from 'vitest'

const pinia = createPinia()

const { defineStore, BaseModel } = setupFeathersPinia({ clients: { api } })

class Message extends BaseModel {
  static modelName = 'Message'
}

const servicePath = 'messages'
const useMessagesService = defineStore({ servicePath, Model: Message })

const messagesService = useMessagesService(pinia)

const reset = () => resetStores(api.service('messages'), messagesService)

describe('Pending State', () => {
  describe('Model.find and Model.get', () => {
    beforeEach(async () => {
      reset()
      await messagesService.create({ text: 'test message' })
    })
    afterAll(() => reset())

    test('pending state for find success', async () => {
      // setup the watcher with a mock function
      const handler = vi.fn()
      watch(() => messagesService.pendingById.Model.find, handler)

      // Trigger the watcher with a request.
      await messagesService.find({ query: {} })

      // The first time it's called, the first argument should be true.
      expect(handler.mock.calls[0][0]).toBe(true)
      // The second time it's called, the first argument should be false.
      expect(handler.mock.calls[1][0]).toBe(false)
    })

    test('pending state for find error', async () => {
      const handler = vi.fn()
      watch(() => messagesService.pendingById.Model.find, handler)

      try {
        // Feathers will throw because of $custom
        await messagesService.find({ query: { $custom: null } })
      } catch (error) {
        expect(handler.mock.calls[0][0]).toBe(true)
        expect(handler.mock.calls[1][0]).toBe(false)
      }
    })

    test('pending state for count success', async () => {
      // setup the watcher with a mock function
      const handler = vi.fn()
      watch(() => messagesService.pendingById.Model.count, handler)

      // Trigger the watcher with a request.
      await messagesService.count({ query: {} })

      // The first time it's called, the first argument should be true.
      expect(handler.mock.calls[0][0]).toBe(true)
      // The second time it's called, the first argument should be false.
      expect(handler.mock.calls[1][0]).toBe(false)
    })

    test('pending state for count error', async () => {
      const handler = vi.fn()
      watch(() => messagesService.pendingById.Model.count, handler)

      try {
        // Feathers will throw because of $custom
        await messagesService.count({ query: { $custom: null } })
      } catch (error) {
        expect(handler.mock.calls[0][0]).toBe(true)
        expect(handler.mock.calls[1][0]).toBe(false)
      }
    })

    test('pending state for get success', async () => {
      const handler = vi.fn()
      watch(() => messagesService.pendingById.Model.get, handler)

      await messagesService.get(0)

      expect(handler.mock.calls[0][0]).toBe(true)
      expect(handler.mock.calls[1][0]).toBe(false)
    })

    test('pending state for get error', async () => {
      const handler = vi.fn()
      watch(() => messagesService.pendingById.Model.get, handler)

      try {
        // Feathers will throw because there's no record with id: 1
        await messagesService.get(1)
      } catch (error) {
        expect(handler.mock.calls[0][0]).toBe(true)
        expect(handler.mock.calls[1][0]).toBe(false)
      }
    })
  })

  describe('instance pending state', () => {
    const message = computed(() => messagesService.itemsById[0])

    beforeEach(async () => {
      // reset()
      await messagesService.create({ text: 'test message' })
    })
    afterEach(() => reset())

    test('pending state for model.create', async () => {
      const createState = computed(() => messagesService.pendingById[1]?.create)
      const handler = vi.fn()
      watch(() => createState.value, handler, { immediate: true })

      const msg = await new Message({ text: 'some new message' }).create()

      expect(msg.isCreatePending).toBe(false)
      expect(msg.isSavePending).toBe(false)

      // Since there's no id, the handler only gets called once with undefined
      expect(handler.mock.calls[0][0]).toBeUndefined()
      expect(handler).toBeCalledTimes(1)
    })

    test('pending state for model.patch', async () => {
      const message = computed(() => messagesService.itemsById[0])

      const patchState = computed(() => messagesService.pendingById[0]?.patch)
      const handler = vi.fn()
      watch(() => patchState.value, handler, { immediate: true })

      const data = { test: true }
      await message.value.patch({ data })

      expect(message.value.isSavePending).toBe(false)
      expect(message.value.isPatchPending).toBe(false)

      expect(handler.mock.calls[0][0]).toBeUndefined()
      expect(handler.mock.calls[1][0]).toBe(true)
      expect(handler.mock.calls[2][0]).toBe(false)
    })

    test('pending state for model.update', async () => {
      const updateState = computed(() => messagesService.pendingById[0]?.update)
      const handler = vi.fn()
      watch(() => updateState.value, handler, { immediate: true })

      await message.value.update()

      expect(message.value.isUpdatePending).toBe(false)

      expect(handler.mock.calls[0][0]).toBeUndefined()
      expect(handler.mock.calls[1][0]).toBe(true)
      expect(handler.mock.calls[2][0]).toBe(false)
    })

    test('pending state for model.remove', async () => {
      const removeState = computed(() => messagesService.pendingById[0]?.remove)
      const handler = vi.fn()
      watch(() => removeState.value, handler, { immediate: true })

      await message.value.remove()

      expect(message.value).toBe(undefined)

      // Not initially in store
      expect(handler.mock.calls[0][0]).toBeUndefined()
      // Set to true while pending
      expect(handler.mock.calls[1][0]).toBe(true)
      // Record gets removed from store
      expect(handler.mock.calls[2][0]).toBeUndefined()
    })
  })

  describe('Model getters for instance state', () => {
    const config = {
      isCreatePending: 'create',
      isPatchPending: 'patch',
      isUpdatePending: 'update',
      isRemovePending: 'remove',
    }
    Object.entries(config).forEach(([title, method]) => {
      test(title, () => {
        messagesService.setPendingById('foo', method, true)
        expect(messagesService[title]).toBeTruthy()
        messagesService.setPendingById('foo', method, false)
        expect(messagesService[title]).toBeFalsy()
      })
    })
  })
})
