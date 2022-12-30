import { useService } from '../../src/use-service/use-service'
import { api } from '../feathers'
import type { Tasks, TasksQuery } from '../feathers-schema-tasks'
import { useBaseModel, useInstanceDefaults, type ModelInstance } from '../../src/use-base-model/index'

const ModelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({ description: '', isComplete: false }, data)
  return withDefaults
}
const Task = useBaseModel<Tasks, TasksQuery, typeof ModelFn>({ name: 'Task', idField: '_id' }, ModelFn)

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
      'idField',
      'whitelist',
      'paramsForServer',
      'skipRequestIfExists',
      'isSsr',

      // items
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
