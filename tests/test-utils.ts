export function resetStores(service: any, store: any) {
  service.store = {}
  service._uId = 0
  store.clearAll()
}
