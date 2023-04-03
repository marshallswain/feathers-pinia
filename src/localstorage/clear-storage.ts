/**
 * Clears all services from localStorage. You might use this when a user
 * logs out to make sure their data doesn't persist for the next user.
 *
 * @param storage an object using the Storage interface
 */
export function clearStorage(storage: Storage = window.localStorage) {
  Object.keys(storage).map((key) => {
    if (key.startsWith('service.')) {
      storage.removeItem(key)
    }
  })
}
