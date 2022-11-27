export function markAsClone<T>(item: T) {
  Object.defineProperty(item, '__isClone', {
    writable: false,
    enumerable: false,
    value: true,
  })
  return item
}
