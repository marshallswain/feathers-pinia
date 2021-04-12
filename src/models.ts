export const models: { [name: string]: any } = {}

export function registerModel(Model: any, store: { clientAlias: string }) {
  models[store.clientAlias] = models[store.clientAlias] || {}
  models[store.clientAlias][Model.modelName] = Model
}
