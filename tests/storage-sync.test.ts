import { syncWithStorage } from '../src/storage-sync'
import { createPinia } from 'pinia'
import { setup } from '../src/index'
import { api } from './feathers'
import { resetStores, timeout } from './test-utils'

const pinia = createPinia()

const { defineStore, BaseModel } = setup({ pinia, clients: { api } })

class Message extends BaseModel {}
const useMessagesService = defineStore({ servicePath: 'messages', Model: Message })
const messagesService = useMessagesService()
const localStorageMock: Storage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
}
syncWithStorage(messagesService, ['tempsById'], localStorageMock)

const reset = () => resetStores(api.service('messages'), messagesService)

describe('Storage Sync', () => {
  beforeEach(() => {
    reset()
  })

  test('writes to storage', async () => {
    const msg = messagesService.add({ test: true })
    await timeout(600)
    expect(localStorageMock.setItem).toHaveBeenCalled()
    const [key, value] = (localStorageMock.setItem as any).mock.calls[0]
    expect(key).toBe('service.messages')
    const val = JSON.parse(value)
    expect(val.tempsById[msg.__tempId]).toBeTruthy()
  })

  test('reads from storage', async () => {
    const msg = messagesService.add({ test: true })
    await timeout(1000)
    expect(localStorageMock.getItem).toHaveBeenCalled()
    const [key, value] = (localStorageMock.getItem as any).mock.calls[0]
    expect(key).toBe('service.messages')
    expect(value).toBeUndefined()
  })
})
