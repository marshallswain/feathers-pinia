import { reactive } from 'vue-demi'
import { Params } from './types'

export function useFindQuery(params: Params) {}

const response = {
  data: [message],
  limit: 10,
  skip: 0,
  total: 120,

  paginate: reactive({ $limit: 10, $skip: 0 }),
  isLoading: false,
  next: () => ({}),
  prev: () => ({}),
}
