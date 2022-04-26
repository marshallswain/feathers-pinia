import { BaseModel } from "./service-store"
import { ModelStatic } from "./service-store/types"

export const models: { [name: string]: any } = {}

export function registerModel(
  Model: ModelStatic<BaseModel>, 
  store: { clientAlias: string }
) {
  models[store.clientAlias] = models[store.clientAlias] || {}
  models[store.clientAlias][Model.modelName] = Model
}
