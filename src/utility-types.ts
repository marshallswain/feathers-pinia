import { PiniaCustomProperties, _GettersTree, _StoreWithGetters, _StoreWithState } from "pinia";
import { Ref, UnwrapRef } from "vue-demi";

export type MaybeRef<T> = T | Ref<T>
export type MaybeArray<T> = T | T[]

export type TypedGetters<
  S, 
  G,
  DefaultS = {},
  DefaultG = {}
> = G &
  ThisType<UnwrapRef<DefaultS & S> & _StoreWithGetters<DefaultG & G> /* & PiniaCustomProperties*/> &
  _GettersTree<DefaultS & S>

export type TypedActions<
  S, 
  G, 
  A, 
  DefaultS = {}, 
  DefaultG = {}, 
  DefaultA = {}
> = A &
  ThisType<
    A &
      UnwrapRef<DefaultS & S> &
      _StoreWithState<any, DefaultS & S, DefaultG & G, DefaultA & A> &
      _StoreWithGetters<DefaultG & G> /* & PiniaCustomProperties*/
  >