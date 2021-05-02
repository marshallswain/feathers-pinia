import { createPinia } from 'pinia'
import { defineAuthStore } from '../src/index'
import { api } from './feathers'
import { resetStores } from './test-utils'

const pinia = createPinia()
const handleResponse = jest.fn()
const handleError = jest.fn()

const useAuth = defineAuthStore({
  id: 'my-auth',
  feathersClient: api,
  state: () => ({
    test: true,
  }),
  getters: {
    foo() {
      return 'bar'
    },
  },
  actions: {
    toggleTest() {
      this.test = false
    },
    handleResponse,
    handleError,
  },
})
const store = useAuth(pinia)

describe('Custom Auth Store functionality', () => {
  beforeEach(() => {
    handleResponse.mockClear()
    handleError.mockClear()
  })
  test('has custom id', async () => {
    expect(store.$id).toBe('my-auth')
  })
  test('receives custom state', async () => {
    expect(store.test).toBeTruthy
  })
  test('receives custom getters', async () => {
    expect(store.foo).toBe('bar')
  })
  test('receives custom actions', async () => {
    expect(store).toHaveProperty('toggleTest')
    store.toggleTest()
    expect(store.test).toBeFalsy
  })
  test('calls handleResponse', async () => {
    await store.authenticate({ strategy: 'jwt' })
    expect(handleResponse).toHaveBeenCalled()
    expect(handleError).not.toHaveBeenCalled()
  })
  test('calls handleError', async () => {
    await store.authenticate({ strategy: 'foo' })
    expect(handleResponse).not.toHaveBeenCalled()
    expect(handleError).toHaveBeenCalled()
  })
})
