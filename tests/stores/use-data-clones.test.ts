import { useServiceClones, useServiceStorage } from '../../src'

const itemStorage = useServiceStorage({ getId: item => item.id })
const tempStorage = useServiceStorage({ getId: item => item.tempId })
const { cloneStorage, clone, commit, reset } = useServiceClones({ itemStorage, tempStorage })

describe('use-service-clones', () => {
  beforeEach(() => {
    itemStorage.clear()
    tempStorage.clear()
    cloneStorage.clear()
  })

  it('can clone', () => {
    const item = { id: 1, name: '1' }
    itemStorage.setItem(1, item)
    const cloned = clone(item)
    expect(cloned).toBe(cloneStorage.getItem(1))
  })

  it('can clone with data', () => {
    const item = { id: 1, name: '1' }
    itemStorage.setItem(1, item)
    const cloned = clone(item, { test: true })
    expect(cloned.test).toBe(true)
  })

  it('can useExisting clone', () => {
    const item = { id: 1, name: '1' }
    itemStorage.setItem(1, item)
    clone(item, { test: true })

    itemStorage.setItem(1, { id: 1, name: 'test' })

    const cloned2 = clone(item, undefined, { useExisting: true })
    expect(cloned2.name).toBe('1')
  })

  it('can commit', () => {
    const item = { id: 1, name: '1' }
    itemStorage.setItem(1, item)
    const cloned = clone(item)
    cloned.name = 'one'
    const committed = commit(cloned)
    expect(committed).toBe(itemStorage.getItem(1))
  })

  it('can reset', () => {
    const item = { id: 1, name: '1' }
    itemStorage.setItem(1, item)
    const cloned = clone(item)
    cloned.name = 'one'
    reset(cloned)
    expect(cloned.name).toBe('1')
  })

  it('clone when missing original: `item` is stored in cloneStorage', () => {
    const item = { id: 1, name: '1' }
    const cloned = clone(item)
    expect(cloned.name).toBe('1')
    expect(itemStorage.getItem(1)).toEqual(item)
  })

  it('commit when missing clone: `item` stored in itemStorage', () => {
    const item = { id: 1, name: '1' }
    const cloned = clone(item)
    expect(cloned.name).toBe('1')
  })

  it('reset when missing original: `item` stored in cloneStorage', () => {
    const item = { id: 1, name: '1' }
    const cloned = reset(item)
    expect(cloned.name).toBe('1')
    expect(itemStorage.getItem(1)).toEqual(item)
  })
})
