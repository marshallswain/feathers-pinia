import { defineStore, StateTree, StoreDefinition, _GettersTree } from 'pinia'
import { DefineStoreOptionsWithDefaults } from './types'
import { TypedActions, TypedGetters } from './utility-types'

type DefineAuthStoreOptions<Id extends string, S extends StateTree, G, A> = DefineStoreOptionsWithDefaults<
  Id,
  S,
  G,
  A,
  AuthStoreDefaultState,
  AuthStoreDefaultGetters,
  AuthStoreDefaultActions
> & {
  feathersClient: any
  id?: string
}

type AuthStoreDefinition<Id extends string, S, G, A> = StoreDefinition<
  Id,
  AuthStoreDefaultState & S,
  AuthStoreDefaultGetters & G,
  AuthStoreDefaultActions & A
>

type AuthStoreTypedGetters = TypedGetters<AuthStoreDefaultState, AuthStoreDefaultGetters>
type AuthStoreTypedActions = TypedActions<AuthStoreDefaultState, AuthStoreDefaultGetters, AuthStoreDefaultActions>

interface AuthStoreDefaultState {
  isLoading: boolean
  isAuthenticated: boolean
  accessToken: string | null // The auth0 and API accessToken
  payload: any // accessToken payload
  error: any
}

interface AuthStoreDefaultGetters extends _GettersTree<AuthStoreDefaultState> {
  feathersClient: () => any
}

interface AuthStoreDefaultActions {
  authenticate: (authData: any) => Promise<any>
  handleResponse: (response: any) => any
  handleError: (err: Error) => any
  setLoaded: (val: boolean) => void
}

export function defineAuthStore<
  Id extends string,
  S extends StateTree = {},
  G extends _GettersTree<S> = {},
  // cannot extends ActionsTree because we loose the typings
  A /* extends ActionsTree */ = {},
>(
  ...args: [DefineAuthStoreOptions<Id, S, G, A>] | [Id, Omit<DefineAuthStoreOptions<Id, S, G, A>, 'id'>]
): AuthStoreDefinition<Id, S, G, A> {
  const id = args.length === 2 ? args[0] : args[0].id || 'auth'
  const options = args.length === 2 ? args[1] : args[0]
  const { feathersClient, state = () => ({} as S), getters = {} as G, actions = {} as A } = options

  /**
   * Default State
   */
  const defaultState: AuthStoreDefaultState = {
    isLoading: true,
    isAuthenticated: false,
    accessToken: null, // The auth0 and API accessToken
    payload: null, // accessToken payload
    error: null,
  }

  /**
   * Default Getters
   */
  const defaultGetters: AuthStoreTypedGetters = {
    feathersClient() {
      return feathersClient
    },
  }

  /**
   * Default Actions
   */
  const defaultActions: AuthStoreTypedActions = {
    async authenticate(authData: any) {
      try {
        const response = await feathersClient.authenticate(authData)
        Object.assign(this, { ...response, isAuthenticated: true })
        return this.handleResponse(response) || response
      } catch (error) {
        this.error = error
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
      this.isLoading = false
    },
  }

  const useAuth = defineStore({
    id: id as Id,
    state: () => Object.assign(defaultState, state()) as AuthStoreDefaultState & S,
    getters: Object.assign(defaultGetters, getters) as AuthStoreDefaultGetters & G,
    actions: Object.assign(defaultActions, actions) as AuthStoreDefaultActions & A,
  })

  return useAuth
}
