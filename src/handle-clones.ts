import { computed, reactive, watch, isRef, unref } from 'vue-demi'
import { isEqual } from 'lodash'
import { _ } from '@feathersjs/commons'
import { getAnyId } from './utils'
import { storeToRefs } from 'pinia'

interface HandleClonesOptions {
  debug?: boolean
  useExisting?: boolean
  watchProps?: Array<any>
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
      const item: any = computed(() => props[key])

      // Check that the item has a store, otherwise we can't clone.
      if (item.value != null && !!item.value.constructor.store) {
        const { store } = item.value.constructor
        // TODO: add the item to the store if it's not already in the store.
        if (
          !store.items.includes(item.value) &&
          !store.temps.includes(item.value) &&
          !store.clones.includes(item.value)
        ) {
          store.addToStore(item.value)
        }

        /**
         * Create a new clone or return an existing one if options.useExisting is true.
         * This prevents infinite loops when the handle-clones utility is used more than
         * once in the same view on the same record.  If you get errors about an infinite
         * loop in a watcher related to "clone.value.id", set useExisting to true on all
         * instances except one.
         */
        const clone = computed(() => {
          if (item.value == null) {
            return null
          }
          const id = getAnyId(item.value)
          const existingClone = store.clonesById[id]
          if (existingClone && useExisting) {
            return existingClone
          }
          return item.value.__isClone ? item.value : item.value.clone()
        })
        watch(
          // Since `item` can change, watch the reactive `item` instead of non-reactive `item`
          () => item.value && getAnyId(item.value),
          (id) => {
            // Update the clones and handlers
            if (!clones[key] || id !== getAnyId(clones[key].value)) {
              clones[key] = clone
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
              saveHandlers[`save_${key}`] = function saveHandler(
                propOrCollection: any,
                opts: SaveHandlerOpts = {}
              ) {
                const original = store.getFromStore(getAnyId(item.value))
                const isArray = Array.isArray(propOrCollection)
                const isString = typeof propOrCollection === 'string'
                const isObject = !isArray && !isString && propOrCollection != null

                function makeError() {
                  throw new Error(
                    `The first argument to 'save${key}' must be a prop name, an array of prop names, or an object`
                  )
                }

                // Validate props. For dotted strings, only use the top-level key.
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
                    : Object.keys(propOrCollection || clone.value).map(validateProp)

                let originalVal
                let cloneVal

                if (isString) {
                  // Check for equality before commit or the values will be equal.
                  originalVal = original[propOrArray as string]
                  cloneVal = clone.value?.[propOrArray as string]
                } else {
                  originalVal = _.pick(original, ...propOrArray)
                  // If an object was provided, prefer it over the clone. (it will overwrite the clone during commit)
                  cloneVal = _.pick(isObject ? propOrCollection : clone.value, ...propOrArray)
                }

                const areEqual = isEqual(originalVal, cloneVal)

                const { commit = true, save = true, saveWith = () => ({}) } = opts
                commit && clone.value.commit()

                if ((!areEqual && save) || clone.value.hasOwnProperty('__tempId')) {
                  const changedData = isString
                    ? { [propOrArray as string]: clone.value[propOrArray as string] }
                    : cloneVal
                  // Manually update the clone for objects.
                  if (isObject) {
                    Object.assign(clone.value, changedData)
                  }
                  const saveWithData =
                    saveWith({
                      item: original,
                      clone: clone.value,
                      data: cloneVal,
                      pick: _.pick,
                    }) || {}
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
                return Promise.resolve({ areEqual: true, wasDataSaved: false, item: original })
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
