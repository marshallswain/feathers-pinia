import { syncWithStorage } from '../../src'
import { api } from '../fixtures'
import { resetService, timeout } from '../test-utils'
import { vi } from 'vitest'

const service = api.service('contacts')

const localStorageMock: Storage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}
syncWithStorage(service.store, ['tempsById'], localStorageMock)

const reset = () => resetService(service)

describe('Storage Sync', () => {
  beforeEach(() => {
    reset()
  })

  test('writes to storage', async () => {
    const msg = service.createInStore({ name: 'test' })
    await timeout(600)
    expect(localStorageMock.setItem).toHaveBeenCalled()
    const [key, value] = (localStorageMock.setItem as any).mock.calls[0]
    expect(key).toBe('service:contacts')
    const val = JSON.parse(value)
    expect(val.tempsById[msg.__tempId]).toBeTruthy()
  })

  test('reads from storage', async () => {
    service.createInStore({ name: 'test2' })
    await timeout(1000)
    expect(localStorageMock.getItem).toHaveBeenCalled()
    const [key, value] = (localStorageMock.getItem as any).mock.calls[0]
    expect(key).toBe('service:contacts')
    expect(value).toBeUndefined()
  })
})
