import { syncWithStorage } from '../src/storage-sync'
import { createPinia } from 'pinia'
import { clearStorage } from '../src/index'
import { api } from './feathers'
import { resetStores, timeout } from './test-utils'
import { vi } from "vitest" 

const pinia = createPinia()

// class Message extends BaseModel {}
// const useMessagesService = defineStore({ servicePath: 'messages', Model: Message })
// const messagesService = useMessagesService(pinia)
const localStorageMock: Storage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
  // Dummy key to make sure removeItem is called
  'service.items': '{"hey": "there"}',
}
// syncWithStorage(messagesService, ['tempsById'], localStorageMock)

const reset = () => resetStores(api.service('messages'), messagesService)

describe.skip('Clear Storage', () => {
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
