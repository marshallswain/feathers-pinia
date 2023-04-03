import type { FeathersService } from '@feathersjs/feathers'
import type { VueService } from '../create-vue-service'
import type { AnyData, AnyDataOrArray } from '../types'
import { FeathersInstance } from '../modeling'

export function convertData(service: VueService<FeathersService>, result: AnyDataOrArray<AnyData>) {
  if (!result) {
    return result
  } else if (Array.isArray(result)) {
    return result.map((i) => service.new(i)) as FeathersInstance<AnyData>[]
  } else if (result && Array.isArray(result.data)) {
    result.data = result.data.map((i) => service.new(i)) as FeathersInstance<AnyData>[]
    return result
  } else {
    return service.new(result) as FeathersInstance<AnyData>
  }
}
