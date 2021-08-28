import { defineStore } from 'pinia'

interface SetupAuthOptions {
  feathersClient: any
  id?: string
  User?: any
  state?: Function
  getters?: { [k: string]: any }
  actions?: { [k: string]: any }
}

export function defineAuthStore({
  feathersClient,
  id = 'auth',
  state = () => ({}),
  getters = {},
  actions = {},
}: SetupAuthOptions): any {
  /**
   * Default State
   */
  const defaultState = {
    isLoading: true,
    isAuthenticated: false,
    accessToken: null, // The auth0 and API accessToken
    payload: null, // accessToken payload
    error: null,
  }

  const defaultGetters = {
    feathersClient() {
      return feathersClient
    },
  }

  /**
   * Default Actions
   */
  const defaultActions = {
    async authenticate(authData: any) {
      try {
        const response = await feathersClient.authenticate(authData)
        Object.assign(this, { ...response, isAuthenticated: true })
        return this.handleResponse(response) || response
      } catch (error) {
        // console.log('error during Feathers API Authentication', error)
        ;(this as any).error = error
        return this.handleError(error as Error)
      }
    },
    /**
     * Overwrite this function to handle the response in your app.
     * @param response The response from authenticate()
     */
    handleResponse(response: any) {
      return response
    },
    /**
     * Overwrite this function to handle the error in your app.
     * @param error the error from authenticate()
     */
    handleError(error: Error) {
      return Promise.reject(error)
    },
    /**
     * For tracking first-load state. Used by the watcher, below.
     */
    setLoaded() {
      ;(this as any).isLoading = false
    },
  }

  const useAuth = defineStore({
    id,
    state: () => Object.assign(defaultState, state()),
    getters: Object.assign(defaultGetters, getters),
    actions: Object.assign(defaultActions, actions),
  })
  return useAuth
}
