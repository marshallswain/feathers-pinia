import { Application } from '@feathersjs/feathers'
import { defineStore, DefineStoreOptions, GettersTree, Store } from 'pinia'

interface SetupAuthOptions<StoreId extends string>  {
  feathersClient: Application
  id?: StoreId
  // TODO @marshallswain: `User` is used nowhere
  User?: any
  state?: () => Partial<AuthState>
  getters?: Partial<AuthGetters>
  actions?: Partial<AuthActions>
}

interface AuthStoreOptions<StoreId extends string> extends DefineStoreOptions<StoreId, AuthState, AuthGetters, AuthActions> {
  feathersClient: Application
  id: StoreId
  state: () => AuthState
  getters: AuthGetters
  actions: AuthActions
}

type AuthStore<StoreId extends string> = Store<StoreId, AuthState, AuthGetters, AuthActions>

interface AuthState {
  [key: string]: any
  isLoading: boolean
  isAuthenticated: boolean
  accessToken: any
  payload: any
  error: any
}

interface AuthGetters extends GettersTree<AuthState> {
  [k: string]: () => any
  feathersClient: () => Application
}
interface AuthActions {
  [k: string]: (...args: any[]) => any
  authenticate(authData: any): any
  handleResponse(response: any): any
  handleError(error: Error): Promise<never>
  setLoaded(): void
}


export function defineAuthStore<StoreId extends string>({
  feathersClient,
  id = 'auth' as StoreId,
  state = () => ({}),
  getters = {},
  actions = {},
}: SetupAuthOptions<StoreId>): AuthStore<StoreId> {
  /**
   * Default State
   */
  const defaultState: AuthState = {
    isLoading: true,
    isAuthenticated: false,
    accessToken: null, // The auth0 and API accessToken
    payload: null, // accessToken payload
    error: null,
  }

  const defaultGetters: AuthGetters = {
    feathersClient() {
      return feathersClient
    },
  }

  /**
   * Default Actions
   */
  const defaultActions: AuthActions = {
    async authenticate(authData: any) {
      try {
        const response = await feathersClient.authenticate(authData)
        Object.assign(this, { ...response, isAuthenticated: true })
        return this.handleResponse(response) || response
      } catch (error) {
        // console.log('error during Feathers API Authentication', error)
        (this as any).error = error
        return this.handleError(error)
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
      (this as any).isLoading = false
    },
  }

  const storeOptions: AuthStoreOptions<StoreId> = {
    id,
    state: () => Object.assign({}, defaultState, state()),
    getters: Object.assign({}, defaultGetters, getters),
    actions: Object.assign({}, defaultActions, actions),
  }

  const useAuth = defineStore(storeOptions)
  return useAuth
}
