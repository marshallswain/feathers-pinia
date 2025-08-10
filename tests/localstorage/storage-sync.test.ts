import { api, localStorageMock } from '../fixtures/index.js'
import { resetService, timeout } from '../test-utils.js'

const service = api.service('contacts')

const reset = () => resetService(service)

describe('Storage Sync', () => {
  beforeEach(() => {
    reset()
  })

  it('writes to storage', async () => {
    const msg = service.createInStore({ name: 'test' })
    await timeout(600)
    expect(localStorageMock.setItem).toHaveBeenCalled()
    const [key, value] = (localStorageMock.setItem as any).mock.calls[0]
    expect(key).toBe('service:contacts')
    const val = JSON.parse(value)
    expect(val.tempsById[msg.__tempId]).toBeTruthy()
  })

  it('reads from storage', async () => {
    service.createInStore({ name: 'test2' })
    await timeout(1000)
    expect(localStorageMock.getItem).toHaveBeenCalled()
    const [key, value] = (localStorageMock.getItem as any).mock.calls[0]
    expect(key).toBe('service:contacts')
    expect(value).toBeUndefined()
  })
})
