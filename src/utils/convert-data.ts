import type { FeathersService } from '@feathersjs/feathers'
import type { PiniaService } from '../create-pinia-service.js'
import type { AnyData, AnyDataOrArray } from '../types.js'
import { ServiceInstance } from '../modeling/index.js'

export function convertData(service: PiniaService<FeathersService>, result: AnyDataOrArray<AnyData>) {
  if (!result) {
    return result
  } else if (Array.isArray(result)) {
    return result.map((i: AnyData) => service.new(i)) as ServiceInstance<AnyData>[]
  } else if (result && Array.isArray(result.data)) {
    result.data = result.data.map((i: AnyData) => service.new(i)) as ServiceInstance<AnyData>[]
    return result
  } else {
    return service.new(result) as ServiceInstance<AnyData>
  }
}
