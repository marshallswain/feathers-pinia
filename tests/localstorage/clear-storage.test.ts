import { syncWithStorage, clearStorage } from '../../src'
import { api } from '../fixtures'
import { resetService, timeout } from '../test-utils'
import { vi } from 'vitest'

const service = api.service('contacts')

const localStorageMock: Storage = {
  getItem: vi.fn(),
  setItem: vi.fn(function () {
    this.length++
  }),
  removeItem: vi.fn(function () {
    this.length--
  }),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(function () {
    return 'service:contacts'
  }),

  // Dummy key to make sure removeItem is called
  'service.items': '{"hey": "there"}',
}
syncWithStorage(service.store, ['tempsById'], localStorageMock)

const reset = () => resetService(service)

describe('Clear Storage', () => {
  beforeEach(() => {
    reset()
  })

  test('clear storage', async () => {
    service.createInStore({ name: 'test' })
    await timeout(600)

    expect(localStorageMock.setItem).toHaveBeenCalled()
    const [key] = (localStorageMock.setItem as any).mock.calls[0]
    expect(key).toBe('service:contacts')

    clearStorage(localStorageMock)
    expect(localStorageMock.removeItem).toHaveBeenCalled()
  })
})
