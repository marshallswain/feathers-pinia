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
      'idField',
      'itemsById',
      'items',
      'itemIds',
      'tempIdField',
      'tempsById',
      'temps',
      'tempIds',
      'clonesById',
      'clones',
      'cloneIds',
      'clone',
      'commit',
      'pagination',
      'whitelist',
      'paramsForServer',
      'skipRequestIfExists',
      'isSsr',
      'findInStore',
      'countInStore',
      'getFromStore',
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
      'clearAll',
      'find',
      'count',
      'get',
      'create',
      'update',
      'patch',
      'remove',
      'useFind',
      'useGet',
      'useGetOnce',
      'useFindWatched',
      'useGetWatched',
      'removeFromStore',
      'addToStore',
      'reset',
    ])
    expect(service).toBeTruthy()
  })
})
