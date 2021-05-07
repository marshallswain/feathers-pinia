import { BaseModel } from "./service-store";
import { AnyData, Model, ModelInstanceOptions, OfTypeModel } from "./service-store/types";

export interface Query {
  [key: string]: any
}

export interface Item {
  [key: string]: any
  [key: number]: any
}

export interface Temp {
  [key: string]: any
  [key: number]: any
}

export interface Clone {
  [key: string]: any
  [key: number]: any
}

export interface PaginationOptions {
  default: number
  max: number
}

export interface Params {
  query?: Query
  paginate?: boolean | Pick<PaginationOptions, 'max'> | { default: true }
  provider?: string
  route?: { [key: string]: string }
  headers?: { [key: string]: any }
  temps?: boolean
  copies?: boolean
  [key: string]: any
}
export interface Paginated<T> {
  total: number
  limit: number
  skip: number
  data: T[]
}

export interface QueryInfo {
  qid: string
  query: Query
  queryId: string
  queryParams: Params
  pageParams: Omit<Params, '$limit' | '$skip'>
  pageId: string
  response: any
  isOutdated: boolean | undefined
}

export interface SetupOptions {
  pinia: any
  clients: { [alias: string]: any }
  idField?: string
  handleEvents?: HandleEvents
  enableEvents?: boolean
  debounceEventsTime?: number
  debounceEventsMaxWait?: number
}

export interface DefineStoreOptions {
  id?: string
  clientAlias?: string
  servicePath: string
  idField?: string
  Model?: OfTypeModel
  actions?: { [k: string]: Function }
}

export interface SetupResult {
  defineStore: any
  BaseModel: any
}

export type EventName = "created" | "patched" | "updated" | "removed";

export interface HandleEvents {
  created?: Function
  patched?: Function
  updated?: Function
  removed?: Function
}
