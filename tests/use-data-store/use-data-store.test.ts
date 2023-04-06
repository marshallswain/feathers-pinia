import { useDataStore } from '../../src'

describe('use service', () => {
  test('setup', () => {
    const service = useDataStore({
      idField: 'id',
    })

    expect(Object.keys(service)).toEqual([
      'new',
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
      'findOneInStore',
      'countInStore',
      'createInStore',
      'getFromStore',
      'patchInStore',
      'removeFromStore',
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
