import { useService } from '../src/use-service/use-service'
import { api } from './feathers'

import type { Tasks } from './feathers-schema-tasks'
import { useInstanceModel, type BaseModelData, useModelBase, useInstanceDefaults } from '../src/use-base-model/index'

const Task = useModelBase<Partial<Tasks & BaseModelData>>((data) => {
  const asModel = useInstanceModel(data, { name: 'Task', idField: '_id' })
  const withDefaults = useInstanceDefaults({ isComplete: false }, asModel)

  return withDefaults
})

describe('use service', () => {
  test('setup', () => {
    const service = useService({
      service: api.service('messages'),
      idField: 'id',
      ModelFn: Task,
    })

    expect(Object.keys(service)).toEqual([
      'service',
      'Model',
      'whitelist',
      'paramsForServer',
      'skipRequestIfExists',
      'isSsr',

      // items
      'idField',
      'itemsById',
      'items',
      'itemIds',

      // temps
      'tempsById',
      'temps',
      'tempIds',

      // clones
      'clonesById',
      'clones',
      'cloneIds',
      'clone',
      'commit',
      'reset',

      // pagination
      'pagination',
      'updatePaginationForQuery',
      'unflagSsr',

      // local queries
      'findInStore',
      'countInStore',
      'getFromStore',
      'removeFromStore',
      'addToStore',
      'clearAll',

      // pending state
      'isPending',
      'createPendingById',
      'updatePendingById',
      'patchPendingById',
      'removePendingById',
      'isFindPending',
      'isCountPending',
      'isGetPending',
      'isCreatePending',
      'isUpdatePending',
      'isPatchPending',
      'isRemovePending',
      'setPending',
      'setPendingById',
      'unsetPendingById',
      'clearAllPending',

      'eventLocks',
      'toggleEventLock',
      'clearEventLock',

      // service methods
      'find',
      'count',
      'get',
      'create',
      'update',
      'patch',
      'remove',

      // service utils
      'useFind',
      'useGet',
      'useGetOnce',
      'useFindWatched',
      'useGetWatched',
    ])
    expect(service).toBeTruthy()
  })
})
