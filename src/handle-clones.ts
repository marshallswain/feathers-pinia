import { computed, reactive, watch, isRef } from 'vue'
import { isEqual } from 'lodash'
import { _ } from '@feathersjs/commons'
import { getId } from './utils'

interface HandleClonesOptions {
  debug?: boolean
  useExisting?: boolean
  watchProps?: string[]
}
interface SaveHandlerOpts {
  commit?: boolean
  save?: boolean
  saveWith?: Function
}

/**
 * Pass in an object with Feathers-Vuex instances at `key` and it will return an object
 * with ref clones at `_key`.
 * @param {*} props can be a component's `props` object OR a plain object full of refs.
 */
export function handleClones(props: any, options: HandleClonesOptions = {}) {
  const { debug = false, useExisting = true, watchProps = [] } = options
  const clones: any = reactive({})
  const saveHandlers: any = {}
  const watchedProps = computed(() => {
    return _.pick(props, ...watchProps)
  })
  function setup() {
    // Watch each model clone in the props. If the record id changes,
    // sync the _clone with the new value.
    Object.keys(props).forEach((key) => {
      const item = isRef(props[key]) ? props[key].value : props[key]

      // Cheap check for an instance of BaseModel
      if (item != null) {
        /**
         * Create a new clone or return an existing one if options.useExisting is true.
         * This prevents infinite loops when the handle-clones utility is used more than
         * once in the same view on the same record.  If you get errors about an infinite
         * loop in a watcher related to "clone.value.id", set useExisting to true on all
         * instances except one.
         */
        const clone = computed(() => {
          const item = isRef(props[key]) ? props[key].value : props[key]
          if (item == null) {
            return null
          }
          //TODO
          //might not need this.
          // const existingClone = item.constructor.clonesById[getId(item)]
          // if (existingClone && useExisting) {
          //   return existingClone
          // }
          return item.__isClone ? item : item.clone()
        })
        const cloneKey = `${key}`
        const cloneId = getId(item)

        watch(
          // Since `item` can change, watch the reactive `clone` instead of non-reactive `item`
          () => clone.value && clone.value[cloneId],
          (id) => {
            // Update the clones and handlers
            if (!clones[cloneKey] || id !== clones[cloneKey][cloneId]) {
              clones[cloneKey] = clone
              /**
               * Each save_handler has the same name as the prop, prepended with `save_`.
               * An `environment` prop would have a `save_environment` handler, and
               * an `envService` prop would have a `save_envService` handler.
               *
               * When a dotted-key path is provided as the `prop`, it will be used to deep-diff
               * the values between the clone's key and the original item's key.  If the values
               * are different, the save method will be called with the `saveWith` return value
               * having been assigned onto the patchData.  To prevent data loss, patchData will
               * always contain the top-level key.  This means that even if you use `address.line1`
               * as the prop, the entire `address` object will be sent in the patch request.
               *
               * @param {String} prop - the dotted path of the key in the object being saved.
               * @param {Object} opts - an options object
               * @param {Boolean} opts.commit - whether to call clone.commit() before saving. default: true
               * @param {Boolean} opts.save - whether to call save if item[prop] and clone[prop] are not equal. default: true
               * @param {Function} opts.saveWith - a function which receives the the original `item`, the `clone
               *        the changed `data`, and the `pick` method from feathers. The return value from `saveWith`
               *        should be an object. The returned object will be merged into the patch data.
               * @
               */
              saveHandlers[`save_${cloneKey}`] = function saveHandler(
                propOrCollection: any,
                opts: SaveHandlerOpts = {}
              ) {
                const isArray = Array.isArray(propOrCollection)
                const isString = typeof propOrCollection === 'string'
                const isObject = typeof propOrCollection === 'object' && propOrCollection != null

                function makeError() {
                  throw new Error(
                    `The first argument to 'save${cloneKey}' must be a prop name, an array of prop names, or an object`
                  )
                }

                // First arg must be an array or string
                if (!isArray && !isString && !isObject) {
                  makeError()
                }

                // Validate props
                function validateProp(prop: string) {
                  if (!prop || typeof prop !== 'string') {
                    makeError()
                  }
                  return prop.split('.')[0]
                }
                const propOrArray = isString
                  ? validateProp(propOrCollection)
                  : isArray
                  ? propOrCollection.map(validateProp)
                  : Object.keys(propOrCollection).map(validateProp)

                let itemVal
                let cloneVal

                if (isString) {
                  // Check for equality before commit or the values will be equal.
                  itemVal = item[propOrArray]
                  cloneVal = clone.value?.propOrArray
                } else if (isArray) {
                  itemVal = _.pick(item, ...propOrArray)
                  cloneVal = _.pick(clone.value, ...propOrArray)
                } else {
                  itemVal = _.pick(item, ...propOrArray)
                  cloneVal = Object.assign({}, propOrCollection)
                }

                const areEqual = isEqual(itemVal, cloneVal)

                const { commit = true, save = true, saveWith = () => ({}) } = opts
                commit && clone.value.commit()

                if (!areEqual && save) {
                  const changedData = isString
                    ? { [propOrArray]: clone.value[propOrArray] }
                    : cloneVal
                  // Manually update the clone for objects.
                  if (isObject) {
                    Object.assign(clone.value, changedData)
                  }
                  const saveWithData =
                    saveWith({ item, clone: clone.value, data: cloneVal, pick: _.pick }) || {}
                  const data = Object.assign(changedData, saveWithData)
                  return clone.value
                    .save({ data })
                    .then((result: any) => {
                      return Promise.resolve({ areEqual: false, wasDataSaved: true, item: result })
                    })
                    .catch((error: any) => {
                      return Promise.reject(error)
                    })
                }
                return Promise.resolve({ areEqual: true, item: itemVal })
              }
            }
          },
          { immediate: true }
        )
      }
    })
  }

  if (watchProps.length) {
    watch(
      () => watchedProps.value,
      () => {
        setup()
      }
    )
  }

  setup()

  return { clones, saveHandlers }
}
