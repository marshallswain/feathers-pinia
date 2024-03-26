import { createPinia, defineStore } from 'pinia'
import { useAuth } from '../../src'
import { api } from '../fixtures/index.js'

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

  test('custom types', async () => {
    interface AuthenticateData {
      strategy: 'jwt' | 'local' | 'ldap'
      accessToken?: string
      tuid?: string
      password?: string
    }

    interface User {
      id: number;
      email: string;
    }

    defineStore('auth', () => {
      const utils = useAuth<AuthenticateData, User>({ api })
      utils.reAuthenticate()
      return { ...utils }
    })
  })

  test('reAuthenticate', async () => {
    const useAuthStore = defineStore('auth', () => {
      const utils = useAuth({ api })
      utils.reAuthenticate()
      return { ...utils }
    })

    const authStore = useAuthStore()
    const expectedResponse = {
      accessToken: 'jwt-access-token',
      payload: {
        test: true,
      },
      user: {
        email: 'test@test.com',
        id: 1,
      },
    }
    const request = await authStore.reAuthenticate()
    expect(request).toEqual(expectedResponse)
  })
})

describe('useAuth in Pinia store with userStore', () => {
  const pinia = createPinia()
  const useAuthStore = defineStore('auth', () => {
    const utils = useAuth({ api, servicePath: 'users' })
    return { ...utils }
  })
  const authStore = useAuthStore(pinia)

  test('authenticate populates user', async () => {
    await authStore.authenticate({ strategy: 'jwt', accessToken: 'hi' })
    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.user.email).toBeDefined()
  })
})
