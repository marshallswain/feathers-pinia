import type { FeathersService } from '@feathersjs/feathers'
import type { PiniaService } from '../create-pinia-service.js'
import type { ServiceInstance } from '../modeling/index.js'
import type { AnyData, AnyDataOrArray } from '../types.js'

export function convertData(service: PiniaService<FeathersService>, result: AnyDataOrArray<AnyData>) {
  if (!result) {
    return result
  }
  else if (Array.isArray(result)) {
    return result.map(i => service.new(i)) as ServiceInstance<AnyData>[]
  }
  else if (result && Array.isArray(result.data)) {
    result.data = result.data.map(i => service.new(i)) as ServiceInstance<AnyData>[]
    return result
  }
  else {
    return service.new(result) as ServiceInstance<AnyData>
  }
}
