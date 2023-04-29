import { timeout } from '../src/utils'

export function resetService(service: any) {
  // reset the wrapped service's memory store
  service.service.store = {}
  service.service._uId = 0
  // clear the pinia store
  service.store.clearAll()
}

export { timeout }

export const timeoutHook = (ms: number) => async () => {
  await timeout(ms)
}
