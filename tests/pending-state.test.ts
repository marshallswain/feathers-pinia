import { watch } from 'vue'
import { createPinia } from 'pinia'
import { setup, models } from '../src/index'
import { api } from './feathers'

const pinia = createPinia()

const { defineStore, BaseModel } = setup({ pinia, clients: { api } })

class Message extends BaseModel {
  modelName = 'Message'
}

const servicePath = 'messages'
const useMessagesService = defineStore({ servicePath, Model: Message })

const messagesService = useMessagesService()

const resetStore = () => (api.service('messages').store = {})
beforeAll(async () => {
  resetStore()
  await messagesService.create({ text: 'test message' })
})
afterAll(() => resetStore())

describe('Model.find and Model.get', () => {
  test('pending state for find success', async () => {
    // setup the watcher with a mock function
    const handleFindPending = jest.fn()
    watch(() => messagesService.pendingById.Model.find, handleFindPending)

    // Trigger the watcher with a request.
    const response = await messagesService.find({ query: {} })

    // The first time it's called, the first argument should be true.
    expect(handleFindPending.mock.calls[0][0]).toBe(true)
    // The second time it's called, the first argument should be false.
    expect(handleFindPending.mock.calls[1][0]).toBe(false)
  })

  test('pending state for find error', async () => {
    const handleFindPending = jest.fn()
    watch(() => messagesService.pendingById.Model.find, handleFindPending)

    try {
      // Feathers will throw because of $custom
      const response = await messagesService.find({ query: { $custom: null } })
    } catch (error) {
      expect(handleFindPending.mock.calls[0][0]).toBe(true)
      expect(handleFindPending.mock.calls[1][0]).toBe(false)
    }
  })

  test('pending state for count success', async () => {
    // setup the watcher with a mock function
    const handleFindPending = jest.fn()
    watch(() => messagesService.pendingById.Model.count, handleFindPending)

    // Trigger the watcher with a request.
    const response = await messagesService.count({ query: {} })

    // The first time it's called, the first argument should be true.
    expect(handleFindPending.mock.calls[0][0]).toBe(true)
    // The second time it's called, the first argument should be false.
    expect(handleFindPending.mock.calls[1][0]).toBe(false)
  })

  test('pending state for count error', async () => {
    const handleFindPending = jest.fn()
    watch(() => messagesService.pendingById.Model.count, handleFindPending)

    try {
      // Feathers will throw because of $custom
      const response = await messagesService.count({ query: { $custom: null } })
    } catch (error) {
      expect(handleFindPending.mock.calls[0][0]).toBe(true)
      expect(handleFindPending.mock.calls[1][0]).toBe(false)
    }
  })

  test('pending state for get success', async () => {
    const handleFindPending = jest.fn()
    watch(() => messagesService.pendingById.Model.get, handleFindPending)

    const response = await messagesService.get(0)

    expect(handleFindPending.mock.calls[0][0]).toBe(true)
    expect(handleFindPending.mock.calls[1][0]).toBe(false)
  })

  test('pending state for get error', async () => {
    const handleFindPending = jest.fn()
    watch(() => messagesService.pendingById.Model.get, handleFindPending)

    try {
      // Feathers will throw because there's no record with id: 1
      const response = await messagesService.get(1)
    } catch (error) {
      expect(handleFindPending.mock.calls[0][0]).toBe(true)
      expect(handleFindPending.mock.calls[1][0]).toBe(false)
    }
  })
})
