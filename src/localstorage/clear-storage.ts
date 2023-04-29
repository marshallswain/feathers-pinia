/**
 * Clears all services from localStorage. You might use this when a user
 * logs out to make sure their data doesn't persist for the next user.
 *
 * @param storage an object using the Storage interface
 */
export function clearStorage(storage: Storage = window.localStorage) {
  const prefix = 'service:' // replace this with your prefix
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key?.startsWith(prefix)) {
      storage.removeItem(key)
    }
  }
}
