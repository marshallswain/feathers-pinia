import { useServiceStore } from '../../src'

describe('useServiceStore', () => {
  test('setup', () => {
    const service = useServiceStore({
      idField: 'id',
    })

    expect(Object.keys(service)).toEqual([
      'new',
      'idField',
      'isSsr',
      'defaultLimit',

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

      // local queries
      'findInStore',
      'findOneInStore',
      'countInStore',
      'createInStore',
      'getFromStore',
      'patchInStore',
      'removeFromStore',
      'clearAll',

      // server options
      'whitelist',
      'paramsForServer',

      // server pagination
      'pagination',
      'updatePaginationForQuery',
      'unflagSsr',
      'getQueryInfo',

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
