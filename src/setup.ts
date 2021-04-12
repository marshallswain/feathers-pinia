import { makeServiceStore, BaseModel } from './service-store/index'
import { defineStore as piniaDefineStore } from 'pinia'
import { registerModel } from './models'

interface SetupOptions {
  pinia: any
  clients: { [alias: string]: any }
  idField?: string
}
interface DefineStoreOptions {
  id?: string
  clientAlias?: string
  servicePath: string
  idField?: string
  Model?: any
}

export function setup({ pinia, clients, idField }: SetupOptions) {
  function defineStore(options: DefineStoreOptions) {
    const { servicePath } = options

    // If no Model class is provided, create a dynamic one.
    if (!options.Model) {
      const classes: any = {}
      console.log('servicePath', servicePath)
      class DynamicBaseModel extends BaseModel {
        modelName = servicePath
      }
      options.Model = DynamicBaseModel
    }
    if (!options.Model.modelName) {
      options.Model.modelName = options.Model.name
    }

    // Create and initialize the Pinia store.
    const storeOptions: any = makeServiceStore({
      storeId: options.id || `service.${options.servicePath}`,
      idField: options.idField || idField || 'id',
      clientAlias: options.clientAlias || 'api',
      servicePath,
      clients,
      Model: options.Model,
    })
    const useStore = piniaDefineStore(storeOptions)
    const initializedStore = useStore(pinia)

    // Monkey patch the model with the store and other options
    Object.assign(options.Model, {
      store: initializedStore,
      pinia,
      servicePath: options.servicePath,
      idField: options.idField || idField,
      clients,
    })

    registerModel(options.Model, initializedStore as any)

    return useStore
  }

  return {
    defineStore,
    BaseModel,
  }
}

// export function setupFeathersPinia(pinia: any, { clients }: { clients: any }) {
//   const piniaPlugin = (context: any) => {
//     Object.keys(pinia.state.value).forEach((name) => {
//       const store = pinia.state.value[name]
//       if (store.$clients === null) {
//         store.$clients = clients
//         console.log(name, store)
//       }
//     })
//     return {}
//   }
//   pinia.use(piniaPlugin)
// }
