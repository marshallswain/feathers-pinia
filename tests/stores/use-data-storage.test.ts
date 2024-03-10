import { useServiceStorage } from '../../src'

const storage = useServiceStorage({
  getId: item => item.id,
})

describe('use-service-storage', () => {
  beforeEach(() => {
    storage.clear()
  })

  test('list and ids', () => {
    const items = [
      { id: 1, name: 'One' },
      { id: 2, name: 'Two' },
      { id: 3, name: 'Three' },
    ]
    const ids = items.map(i => i.id.toString())
    items.map(item => storage.set(item))
    expect(storage.list.value).toEqual(items)
    expect(storage.ids.value).toEqual(ids)
  })

  test('setItem', () => {
    const item = { id: 1, name: 'One' }
    const stored = storage.setItem(1, item)
    expect(stored).toEqual(item)
    expect(storage.byId.value[1]).toEqual(item)
  })

  test('set', () => {
    const item = { id: 1, name: 'One' }
    const stored = storage.set(item)
    expect(stored).toEqual(item)
    expect(storage.byId.value[1]).toEqual(item)
  })

  test('hasItem', () => {
    const item = { id: 1, name: 'One' }
    expect(storage.hasItem(1)).toBeFalsy()
    storage.set(item)
    expect(storage.hasItem(1)).toBeTruthy()
  })

  test('has', () => {
    const item = { id: 1, name: 'One' }
    expect(storage.has(item)).toBeFalsy()
    storage.set(item)
    expect(storage.has(item)).toBeTruthy()
  })

  test('merge', () => {
    const item = { id: 1, name: 'One' }
    storage.merge(item)
    expect(storage.has(item)).toBeTruthy()

    storage.merge({ id: 1, test: true })
    expect(storage.getItem(1)).toEqual({ id: 1, name: 'One', test: true })
  })

  test('getItem', () => {
    const item = { id: 1, name: 'One' }
    storage.set(item)
    expect(storage.getItem(1)).toEqual(item)
  })

  test('get', () => {
    const item = { id: 1, name: 'One' }
    storage.set(item)
    expect(storage.get({ id: 1 })).toEqual(item)
  })

  test('removeItem', () => {
    const item = { id: 1, name: 'One' }
    storage.set(item)
    expect(storage.list.value.length).toBe(1)
    storage.removeItem(1)
    expect(storage.list.value.length).toBe(0)
  })

  test('remove', () => {
    const item = { id: 1, name: 'One' }
    storage.set(item)
    expect(storage.list.value.length).toBe(1)
    storage.remove(item)
    expect(storage.list.value.length).toBe(0)
  })

  test('getKeys', () => {
    const item = { id: 1, name: 'One' }
    storage.set(item)
    expect(storage.getKeys()).toEqual(['1'])
  })

  test('clear', () => {
    const items = [
      { id: 1, name: 'One' },
      { id: 2, name: 'Two' },
      { id: 3, name: 'Three' },
    ]
    items.map(item => storage.set(item))
    expect(storage.list.value.length).toEqual(3)
    storage.clear()
    expect(storage.list.value.length).toEqual(0)
  })
})
