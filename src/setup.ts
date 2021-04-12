import { makeServiceStore, BaseModel } from './service-store/index'
import { defineStore as piniaDefineStore } from 'pinia'

interface SetupOptions {
  pinia: any
  clients: { [alias: string]: any }
  idField?: string
}
interface DefineStoreOptions {
  id?: string
  servicePath: string
  idField?: string
  Model?: any
}

export function setup({ pinia, clients, idField }: SetupOptions) {
  function defineStore(options: DefineStoreOptions) {
    const { servicePath } = options
    if (!options.Model) {
      const classes: any = {}
      console.log('servicePath', servicePath)
      class DynamicBaseModel extends BaseModel {
        modelName = servicePath
      }
      options.Model = DynamicBaseModel
    }

    const storeOptions: any = makeServiceStore({
      storeId: options.id || `service.${options.servicePath}`,
      idField: options.idField || idField,
      servicePath,
      clients,
      Model: options.Model,
    })
    const useStore = piniaDefineStore(storeOptions)
    const initializedStore = useStore(pinia)

    Object.assign(options.Model, {
      store: initializedStore,
      servicePath: options.servicePath,
      idField: options.idField || idField,
      clients,
    })

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
