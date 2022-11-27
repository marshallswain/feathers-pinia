import { defineStore, Pinia } from 'pinia'

export const defineServiceStore = <Id extends string, SS>(id: Id, setupStore: () => SS) => {
  const storeDefinition = defineStore(id, setupStore)

  return (pinia?: Pinia) => {
    const store = storeDefinition(pinia)

    // @ts-expect-error - we're adding a property to the store
    const model = store.Model

    Object.assign(model, {
      store,
    })
    return store
  }
}
