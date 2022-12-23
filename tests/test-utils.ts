export function resetStores(service: any, store: any) {
  resetServiceStore(service)
  store.clearAll()
}

export function resetServiceStore(service: any) {
  service.store = {}
  service._uId = 0
}

export function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const timeoutHook = (ms: number) => async () => {
  await timeout(ms)
}
