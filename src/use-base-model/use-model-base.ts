import { reactive } from 'vue'
// import fastCopy from 'fast-copy'

interface UseBaseModelOptions {
  name: string
}
interface BaseModel {
  /**
   * the name of the Model function
   */
  readonly __modelName: string
  /**
   * Will be `true` if this instance is a clone
   */
  readonly __isClone: boolean
}

interface BaseModelData {
  __isClone?: boolean
}

type BaseModelSetupFn<T extends Record<string, any>> = (
  data: Partial<T> & BaseModel
) => Partial<T> & BaseModel

export const useBaseModel = <T extends Record<string, any>>(
  options: UseBaseModelOptions,
  setup: BaseModelSetupFn<T>
) => {
  const { name } = options

  return (data: T & BaseModelData) => {
    const __isClone = data.__isClone || false

    const _data = data as T & BaseModel
    Object.defineProperties(_data, {
      __modelName: {
        enumerable: false,
        writable: false,
        value: name,
      },
      __isClone: {
        enumerable: false,
        writable: false,
        value: __isClone,
      },
    })
    return setup(reactive(_data))
  }
}
