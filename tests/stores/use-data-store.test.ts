import { useDataStore } from '../../src'

describe('useDataStore', () => {
  it('setup', () => {
    const service = useDataStore({
      idField: 'id',
    })

    expect(Object.keys(service)).toEqual([
      'new',
      'idField',
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

      // local queries
      'findInStore',
      'findOneInStore',
      'countInStore',
      'createInStore',
      'getFromStore',
      'patchInStore',
      'removeFromStore',
      'clearAll',
    ])
    expect(service).toBeTruthy()
  })
})
