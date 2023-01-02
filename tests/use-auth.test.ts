import { createPinia, defineStore } from 'pinia'
import { feathersPiniaHooks, ModelInstance, useAuth, useFeathersModel, useInstanceDefaults } from '../src'
import { api } from './feathers'
import type { Users, UsersData, UsersQuery } from './feathers-schema-users'

// User Model
const service = api.service('users')
const modelFn = (data: ModelInstance<Users>) => {
  const withDefaults = useInstanceDefaults({ description: '', isComplete: false }, data)
  return withDefaults
}
const User = useFeathersModel<Users, UsersData, UsersQuery, typeof modelFn>(
  { name: 'User', idField: '_id', service },
  modelFn,
)
service.hooks({ around: { all: [...feathersPiniaHooks(User)] } })

describe('useAuth return values', () => {
  const utils = useAuth({ api })

  test('can authenticate', async () => {
    const response = await utils.authenticate({ strategy: 'jwt', accessToken: 'hi' })
    expect(response).toHaveProperty('accessToken')
    expect(response).toHaveProperty('payload')
  })
})

describe('useAuth in Pinia store', () => {
  const pinia = createPinia()
  const useAuthStore = defineStore('auth', () => {
    const utils = useAuth({ api })
    return { ...utils }
  })
  const authStore = useAuthStore(pinia)

  test('has all useAuth values', async () => {
    expect(authStore.$id).toBe('auth')
    expect(typeof authStore.authenticate).toBe('function')
    expect(typeof authStore.clearError).toBe('function')
    expect(typeof authStore.getPromise).toBe('function')
    expect(typeof authStore.isTokenExpired).toBe('function')
    expect(typeof authStore.logout).toBe('function')
    expect(typeof authStore.reAuthenticate).toBe('function')
    expect(authStore.error).toBeDefined()
    expect(authStore.isAuthenticated).toBeDefined()
    expect(authStore.isInitDone).toBeDefined()
    expect(authStore.isLogoutPending).toBeDefined()
    expect(authStore.isPending).toBeDefined()
    expect(authStore.loginRedirect).toBeDefined()
    expect(authStore.user).toBeNull()
  })

  test('authenticate', async () => {
    await authStore.authenticate({ strategy: 'jwt', accessToken: 'hi' })
    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.user).toBeNull()
  })
})

describe('useAuth in Pinia store with userStore', () => {
  const pinia = createPinia()
  const useAuthStore = defineStore('auth', () => {
    const utils = useAuth({ api, userStore: User.store })
    return { ...utils }
  })
  const authStore = useAuthStore(pinia)

  test('authenticate populates user', async () => {
    await authStore.authenticate({ strategy: 'jwt', accessToken: 'hi' })
    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.user.email).toBeDefined()
  })
})
