import { syncWithStorage } from '../src/storage-sync'
import { createPinia } from 'pinia'
import { setupFeathersPinia, clearStorage } from '../src/index'
import { api } from './feathers'
import { resetStores, timeout } from './test-utils'

const pinia = createPinia()

const { defineStore, BaseModel } = setupFeathersPinia({ clients: { api } })

class Message extends BaseModel {}
const useMessagesService = defineStore({ servicePath: 'messages', Model: Message })
const messagesService = useMessagesService(pinia)
const localStorageMock: Storage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
  // Dummy key to make sure removeItem is called
  'service.items': '{"hey": "there"}',
}
syncWithStorage(messagesService, ['tempsById'], localStorageMock)

const reset = () => resetStores(api.service('messages'), messagesService)

describe('Clear Storage', () => {
  beforeEach(() => {
    reset()
  })

  test('clear storage', async () => {
    messagesService.addToStore({ test: true })
    await timeout(600)

    expect(localStorageMock.setItem).toHaveBeenCalled()
    const [key] = (localStorageMock.setItem as any).mock.calls[0]
    expect(key).toBe('service.messages')

    clearStorage(localStorageMock)
    expect(localStorageMock.removeItem).toHaveBeenCalled()
  })
})
