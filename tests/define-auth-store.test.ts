import { createPinia } from 'pinia'
import { defineAuthStore } from '../src/index'
import { api } from './feathers'
import { resetStores } from './test-utils'

const pinia = createPinia()

const useAuth = defineAuthStore({ feathersClient: api })
const store = useAuth(pinia)

describe('Define Auth Store', () => {
  test('can authenticate', async () => {
    const response = await store.authenticate({ strategy: 'jwt', accessToken: 'hi' })
    expect(response).toHaveProperty('accessToken')
    expect(response).toHaveProperty('payload')
  })
  test('adds auth data to the store', async () => {
    const response = await store.authenticate({ strategy: 'jwt', accessToken: 'hi' })
    expect(store.accessToken).toBeTruthy
    expect(store.payload).toBeTruthy
    expect(store.user).toBeUndefined
  })
  test('has a feathersClient getter', async () => {
    expect(store.feathersClient).toBeTruthy
  })
})
