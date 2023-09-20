export interface StoragePlugin {
  getItem: Function,
  setItem: Function,
  removeItem: Function,
  onChange: Function
}
