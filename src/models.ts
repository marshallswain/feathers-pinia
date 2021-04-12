export const models: { [name: string]: any } = {}

export function registerModel(Model: any, storeOptions: { clientAlias: string }) {
  models[storeOptions.clientAlias][Model.modelName] = Model
}
