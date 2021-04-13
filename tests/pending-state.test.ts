import { watch, computed } from 'vue'
import { createPinia } from 'pinia'
import { setup, models } from '../src/index'
import { api } from './feathers'
import { resetStores } from './test-utils'

const pinia = createPinia()

const { defineStore, BaseModel } = setup({ pinia, clients: { api } })

class Message extends BaseModel {
  static modelName = 'Message'
}

const servicePath = 'messages'
const useMessagesService = defineStore({ servicePath, Model: Message })

const messagesService = useMessagesService()

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
      const handler = jest.fn()
      watch(() => messagesService.pendingById.Model.find, handler)

      // Trigger the watcher with a request.
      const response = await messagesService.find({ query: {} })

      // The first time it's called, the first argument should be true.
      expect(handler.mock.calls[0][0]).toBe(true)
      // The second time it's called, the first argument should be false.
      expect(handler.mock.calls[1][0]).toBe(false)
    })

    test('pending state for find error', async () => {
      const handler = jest.fn()
      watch(() => messagesService.pendingById.Model.find, handler)

      try {
        // Feathers will throw because of $custom
        const response = await messagesService.find({ query: { $custom: null } })
      } catch (error) {
        expect(handler.mock.calls[0][0]).toBe(true)
        expect(handler.mock.calls[1][0]).toBe(false)
      }
    })

    test('pending state for count success', async () => {
      // setup the watcher with a mock function
      const handler = jest.fn()
      watch(() => messagesService.pendingById.Model.count, handler)

      // Trigger the watcher with a request.
      const response = await messagesService.count({ query: {} })

      // The first time it's called, the first argument should be true.
      expect(handler.mock.calls[0][0]).toBe(true)
      // The second time it's called, the first argument should be false.
      expect(handler.mock.calls[1][0]).toBe(false)
    })

    test('pending state for count error', async () => {
      const handler = jest.fn()
      watch(() => messagesService.pendingById.Model.count, handler)

      try {
        // Feathers will throw because of $custom
        const response = await messagesService.count({ query: { $custom: null } })
      } catch (error) {
        expect(handler.mock.calls[0][0]).toBe(true)
        expect(handler.mock.calls[1][0]).toBe(false)
      }
    })

    test('pending state for get success', async () => {
      const handler = jest.fn()
      watch(() => messagesService.pendingById.Model.get, handler)

      const response = await messagesService.get(0)

      expect(handler.mock.calls[0][0]).toBe(true)
      expect(handler.mock.calls[1][0]).toBe(false)
    })

    test('pending state for get error', async () => {
      const handler = jest.fn()
      watch(() => messagesService.pendingById.Model.get, handler)

      try {
        // Feathers will throw because there's no record with id: 1
        const response = await messagesService.get(1)
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
      const msg = await messagesService.create({ text: 'test message' })
    })
    afterEach(() => reset())

    test('pending state for model.create', async () => {
      const createState = computed(() => messagesService.pendingById[1]?.create)
      const handler = jest.fn()
      watch(() => createState.value, handler, { immediate: true })

      const modelCreateState = computed(() => messagesService.pendingById.Model?.create)
      const modelHandler = jest.fn()
      watch(() => modelCreateState.value, modelHandler, { immediate: true })

      const msg = await new Message({ text: 'some new message' }).create()

      expect(msg.isCreatePending).toBe(false)
      expect(msg.isSavePending).toBe(false)

      // Since there's no id, the handler only gets called once with undefined
      expect(handler.mock.calls[0][0]).toBeUndefined()
      expect(handler).toBeCalledTimes(1)

      // The model handler still gets called the same number of times as other methods
      expect(modelHandler).toBeCalledTimes(3)
    })

    test('pending state for model.patch', async () => {
      const message = computed(() => messagesService.itemsById[0])

      const patchState = computed(() => messagesService.pendingById[0]?.patch)
      const handler = jest.fn()
      watch(() => patchState.value, handler, { immediate: true })

      const modelPatchState = computed(() => messagesService.pendingById.Model?.patch)
      const modelHandler = jest.fn()
      watch(() => modelPatchState.value, modelHandler, { immediate: true })

      const data = { test: true }
      await message.value.patch({ data })

      expect(message.value.isSavePending).toBe(false)
      expect(message.value.isPatchPending).toBe(false)

      expect(handler.mock.calls[0][0]).toBeUndefined()
      expect(handler.mock.calls[1][0]).toBe(true)
      expect(handler.mock.calls[2][0]).toBe(false)

      expect(modelHandler).toBeCalledTimes(3)
    })

    test('pending state for model.update', async () => {
      const updateState = computed(() => messagesService.pendingById[0]?.update)
      const handler = jest.fn()
      watch(() => updateState.value, handler, { immediate: true })

      const modelUpdateState = computed(() => messagesService.pendingById.Model?.update)
      const modelHandler = jest.fn()
      watch(() => modelUpdateState.value, modelHandler, { immediate: true })

      await message.value.update()

      expect(message.value.isUpdatePending).toBe(false)

      expect(handler.mock.calls[0][0]).toBeUndefined()
      expect(handler.mock.calls[1][0]).toBe(true)
      expect(handler.mock.calls[2][0]).toBe(false)

      expect(modelHandler).toBeCalledTimes(3)
    })

    test('pending state for model.remove', async () => {
      const removeState = computed(() => messagesService.pendingById[0]?.remove)
      const handler = jest.fn()
      watch(() => removeState.value, handler, { immediate: true })

      const modelRemoveState = computed(() => messagesService.pendingById.Model?.remove)
      const modelHandler = jest.fn()
      watch(() => modelRemoveState.value, modelHandler, { immediate: true })

      await message.value.remove()

      expect(message.value).toBe(undefined)

      // Not initially in store
      expect(handler.mock.calls[0][0]).toBeUndefined()
      // Set to true while pending
      expect(handler.mock.calls[1][0]).toBe(true)
      // Record gets removed from store
      expect(handler.mock.calls[2][0]).toBeUndefined()

      expect(modelHandler).toBeCalledTimes(3)
    })
  })
})
