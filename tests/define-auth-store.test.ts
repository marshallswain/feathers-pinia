import { createPinia } from 'pinia'
import { defineAuthStore } from '../src/index'
import { api } from './feathers'
import { resetStores } from './test-utils'

const pinia = createPinia()

describe('Define Auth Store 1 (from options without options.id)', () => {
  const useAuth = defineAuthStore({ feathersClient: api })
  const store = useAuth(pinia)
  test('can authenticate', async () => {
    const response = await store.authenticate({ strategy: 'jwt', accessToken: 'hi' })
    expect(store.$id).toBe('auth')
    expect(response).toHaveProperty('accessToken')
    expect(response).toHaveProperty('payload')
  })
  test('adds auth data to the store', async () => {
    const response = await store.authenticate({ strategy: 'jwt', accessToken: 'hi' })
    expect(store.$id).toBe('auth')
    expect(store.accessToken).toBeTruthy
    expect(store.payload).toBeTruthy
    expect(store.user).toBeUndefined
  })
  test('has a feathersClient getter', async () => {
    expect(store.feathersClient).toBeTruthy
  })
})

describe('Define Auth Store 2 (from options with options.id)', () => {
  const useAuth = defineAuthStore({ id: 'auth2', feathersClient: api })
  const store = useAuth(pinia)
  test('can authenticate', async () => {
    const response = await store.authenticate({ strategy: 'jwt', accessToken: 'hi' })
    expect(store.$id).toBe('auth2')
    expect(response).toHaveProperty('accessToken')
    expect(response).toHaveProperty('payload')
  })
  test('adds auth data to the store', async () => {
    const response = await store.authenticate({ strategy: 'jwt', accessToken: 'hi' })
    expect(store.$id).toBe('auth2')
    expect(store.accessToken).toBeTruthy
    expect(store.payload).toBeTruthy
    expect(store.user).toBeUndefined
  })
  test('has a feathersClient getter', async () => {
    expect(store.feathersClient).toBeTruthy
  })
})

describe('Define Auth Store 3 (from id and options without options.id)', () => {
  const useAuth = defineAuthStore('auth3', { feathersClient: api })
  const store = useAuth(pinia)
  test('can authenticate', async () => {
    const response = await store.authenticate({ strategy: 'jwt', accessToken: 'hi' })
    expect(store.$id).toBe('auth3')
    expect(response).toHaveProperty('accessToken')
    expect(response).toHaveProperty('payload')
  })
  test('adds auth data to the store', async () => {
    const response = await store.authenticate({ strategy: 'jwt', accessToken: 'hi' })
    expect(store.$id).toBe('auth3')
    expect(store.accessToken).toBeTruthy
    expect(store.payload).toBeTruthy
    expect(store.user).toBeUndefined
  })
  test('has a feathersClient getter', async () => {
    expect(store.feathersClient).toBeTruthy
  })
})

describe('Define Auth Store 4 (from id and options with options.id)', () => {
  const useAuth = defineAuthStore('auth4', { id: 'should-be-overriden', feathersClient: api })
  const store = useAuth(pinia)
  test('can authenticate', async () => {
    const response = await store.authenticate({ strategy: 'jwt', accessToken: 'hi' })
    expect(store.$id).toBe('auth4')
    expect(response).toHaveProperty('accessToken')
    expect(response).toHaveProperty('payload')
  })
  test('adds auth data to the store', async () => {
    const response = await store.authenticate({ strategy: 'jwt', accessToken: 'hi' })
    expect(store.$id).toBe('auth4')
    expect(store.accessToken).toBeTruthy
    expect(store.payload).toBeTruthy
    expect(store.user).toBeUndefined
  })
  test('has a feathersClient getter', async () => {
    expect(store.feathersClient).toBeTruthy
  })
})
