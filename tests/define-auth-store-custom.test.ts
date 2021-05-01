import { createPinia } from 'pinia'
import { defineAuthStore } from '../src/index'
import { api } from './feathers'
import { resetStores } from './test-utils'

const pinia = createPinia()

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
  },
})
const store = useAuth(pinia)

describe('Custom Auth Store functionality', () => {
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
})
