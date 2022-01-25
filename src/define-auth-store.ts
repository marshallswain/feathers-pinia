import { defineStore, DefineStoreOptionsBase, PiniaCustomProperties, StateTree, Store, StoreDefinition, _GettersTree, _StoreWithGetters, _StoreWithState } from 'pinia'
import { UnwrapRef } from "vue-demi";

interface DefineAuthStoreOptions<
  Id extends string,
  S extends StateTree,
  G /* extends GettersTree<S> */,
  A /* extends Record<string, StoreAction> */
> extends DefineStoreOptionsBase<S, Store<Id, S, G, A>> {
  feathersClient: any
  id?: Id
  state?: () => S

  getters?: G &
     ThisType<UnwrapRef<AS<S>> & _StoreWithGetters<AS<S>> & PiniaCustomProperties> &
     _GettersTree<S>
 
   actions?: A &
     ThisType<
       A &
         UnwrapRef<AS<S>> &
         _StoreWithState<Id, AS<S>, AG<G>, AA<A>> &
         _StoreWithGetters<AG<G>> &
         PiniaCustomProperties
     >
}

interface AuthStoreDefaultState {
  isLoading: boolean,
  isAuthenticated: boolean,
  accessToken: string | null, // The auth0 and API accessToken
  payload: any, // accessToken payload
  error: any,
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

type AS<S> = AuthStoreDefaultState & S;
type AG<G> = AuthStoreDefaultGetters & G
type AA<A> = AuthStoreDefaultActions & A;

export function defineAuthStore<
  Id extends string,
  S extends StateTree = {},
  G extends _GettersTree<S> = {},
  // cannot extends ActionsTree because we loose the typings
  A /* extends ActionsTree */ = {}
>(
  ...args: [DefineAuthStoreOptions<Id, S, G, A>] | [Id, Omit<DefineAuthStoreOptions<Id, S, G, A>, 'id'>]
): StoreDefinition<Id, AS<S>, AG<G>, AA<A>> {
  const id = args.length === 2 ? args[0] : args[0].id || 'auth'
  const options = args.length === 2 ? args[1] : args[0]
  const {
    feathersClient,
    state = () => ({}) as S,
    getters = {} as G,
    actions = {} as A,
  } = options

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
  const defaultGetters: AuthStoreDefaultGetters = {
    feathersClient() {
      return feathersClient
    },
  }

  /**
   * Default Actions
   */
  const defaultActions: AuthStoreDefaultActions = {
    async authenticate(authData: any) {
      try {
        const response = await feathersClient.authenticate(authData)
        Object.assign(this, { ...response, isAuthenticated: true })
        return this.handleResponse(response) || response
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-extra-semi
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
      (this as any).isLoading = false
    },
  }

  const useAuth = defineStore({
    id: id as Id,
    state: () => Object.assign(defaultState, state()),
    getters: Object.assign(defaultGetters, getters),
    actions: Object.assign(defaultActions, actions),
  })

  return useAuth
}