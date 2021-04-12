export interface Query {
  [key: string]: any
}

export interface PaginationOptions {
  default: number
  max: number
}

export interface Params {
  query?: Query
  paginate?: false | Pick<PaginationOptions, 'max'>
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
