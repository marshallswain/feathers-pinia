export function clearStorage(storage: Storage = window.localStorage) {
  Object.keys(storage).map((key) => {
    if (key.startsWith('service.')) {
      storage.removeItem(key)
    }
  })
}
