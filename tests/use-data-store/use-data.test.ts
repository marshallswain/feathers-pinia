import { useDataStore } from '../../src/'
import { api } from '../fixtures'

describe('use service', () => {
  test('setup', () => {
    const service = useDataStore({
      idField: 'id',
    })

    expect(Object.keys(service)).toEqual([
      'idField',
      'whitelist',
      'paramsForServer',
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
      'removeByQuery',
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
    ])
    expect(service).toBeTruthy()
  })
})
