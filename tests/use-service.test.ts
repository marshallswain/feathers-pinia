import { useService } from '../src/use-service/use-service'
import { api } from './feathers'

const service = useService({
  service: api.service('messages'),
  idField: 'id',
})

describe('use-service', () => {
  test('setup', () => {
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
      'tempIdField',
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
