import { useDataStore } from '../../src'
import { createPinia, defineStore } from 'pinia'
import { ref, computed } from 'vue-demi'

const pinia = createPinia()

const useStore = defineStore('custom-tasks', () => {
  const utils = useDataStore({
    idField: 'id',
  })
  return { ...utils }
})
const store = useStore(pinia)

const record = { id: 1, description: 'Build FeathersJS', isComplete: true }
const records = [
  { id: 2, description: 'Test Feathers-Pinia', isComplete: true },
  { id: 3, description: 'Release Feathers-Pinia', isComplete: true },
]

describe('standalone stores', () => {
  beforeEach(() => {
    store.clearAll()
  })

  describe('store methods', () => {
    it('can store.new', async () => {
      const task = store.new(record)
      expect(task.__isStoreInstance).toBe(true)
      expect(task.__isClone).toBe(false)
      expect(task.__idField).toBe('id')
      expect(task.__tempId).toBe(undefined)
      expect(task.__isTemp).toBe(false)
      expect(typeof task.hasClone).toBe('function')
      expect(typeof task.clone).toBe('function')
      expect(typeof task.commit).toBe('function')
      expect(typeof task.reset).toBe('function')
      expect(typeof task.createInStore).toBe('function')
      expect(typeof task.removeFromStore).toBe('function')
    })

    it('can findInStore with plain params object', async () => {
      const records = [
        { id: 2, description: 'Test Feathers-Pinia', isComplete: true },
        { id: 3, description: 'Release Feathers-Pinia', isComplete: true },
      ]
      store.createInStore(records)

      const { data } = store.findInStore({ query: { id: 2 } })
      expect(data.value[0].id).toBe(2)
    })

    it('can findInStore with ref params object', async () => {
      const records = [
        { id: 2, description: 'Test Feathers-Pinia', isComplete: true },
        { id: 3, description: 'Release Feathers-Pinia', isComplete: true },
      ]
      store.createInStore(records)

      const { data } = store.findInStore(ref({ query: { id: 2 } }))
      expect(data.value[0].id).toBe(2)
    })

    it('can findInStore with computed params object', async () => {
      const records = [
        { id: 2, description: 'Test Feathers-Pinia', isComplete: true },
        { id: 3, description: 'Release Feathers-Pinia', isComplete: true },
      ]
      store.createInStore(records)

      const { data } = store.findInStore(computed(() => ({ query: { id: 2 } })))
      expect(data.value[0].id).toBe(2)
    })

    it('findInStore with computed params is reactive', async () => {
      const records = [
        { id: 2, description: 'Test Feathers-Pinia', isComplete: true },
        { id: 3, description: 'Release Feathers-Pinia', isComplete: true },
      ]
      store.createInStore(records)

      const id = ref(2)
      const { data } = store.findInStore(computed(() => ({ query: { id } })))
      id.value = 3
      expect(data.value[0].id).toBe(3)
    })

    it('can findOneInStore with plain params object', async () => {
      const records = [
        { id: 2, description: 'Test Feathers-Pinia', isComplete: true },
        { id: 3, description: 'Release Feathers-Pinia', isComplete: true },
      ]
      store.createInStore(records)

      const results = store.findOneInStore({ query: { id: 2 } })
      expect(results.value.id).toBe(2)
    })

    it('can findOneInStore with ref params object', async () => {
      const records = [
        { id: 2, description: 'Test Feathers-Pinia', isComplete: true },
        { id: 3, description: 'Release Feathers-Pinia', isComplete: true },
      ]
      store.createInStore(records)

      const results = store.findOneInStore(ref({ query: { id: 2 } }))
      expect(results.value.id).toBe(2)
    })

    it('can findOneInStore with ref params object', async () => {
      const records = [
        { id: 2, description: 'Test Feathers-Pinia', isComplete: true },
        { id: 3, description: 'Release Feathers-Pinia', isComplete: true },
      ]
      store.createInStore(records)

      const results = store.findOneInStore(computed(() => ({ query: { id: 2 } })))
      expect(results.value.id).toBe(2)
    })

    it('findOneInStore with computed params is reactive', async () => {
      const records = [
        { id: 2, description: 'Test Feathers-Pinia', isComplete: true },
        { id: 3, description: 'Release Feathers-Pinia', isComplete: true },
      ]
      store.createInStore(records)

      const id = ref(2)
      const data = store.findOneInStore(computed(() => ({ query: { id } })))
      id.value = 3
      expect(data.value.id).toBe(3)
    })

    it('can countInStore with plain params object', async () => {
      store.createInStore(records)

      const results = store.countInStore({ query: {} })
      expect(results.value).toBe(2)
    })

    it('can countInStore with ref params object', async () => {
      store.createInStore(records)

      const results = store.countInStore(ref({ query: {} }))
      expect(results.value).toBe(2)
    })

    it('can countInStore with computed params object', async () => {
      store.createInStore(records)

      const results = store.countInStore(computed(() => ({ query: {} })))
      expect(results.value).toBe(2)
    })

    it('countInStore with computed params is reactive', async () => {
      const records = [
        { id: 2, description: 'Test Feathers-Pinia', isComplete: true },
        { id: 3, description: 'Release Feathers-Pinia', isComplete: true },
      ]
      store.createInStore(records)

      const id = ref<any>(2)
      const total = store.countInStore(computed(() => ({ query: { id } })))
      id.value = { $in: [2, 3] }
      expect(total.value).toBe(2)
    })

    it('can getFromStore existing record with primitive id', async () => {
      store.createInStore(record)
      const result = store.getFromStore(1)
      expect(result.value?.id).toBe(1)
    })

    it('can getFromStore existing record with ref id', async () => {
      store.createInStore(record)
      const result = store.getFromStore(ref(1))
      expect(result.value?.id).toBe(1)
    })

    it('can getFromStore existing record with computed id', async () => {
      store.createInStore(record)
      const result = store.getFromStore(computed(() => 1))
      expect(result.value?.id).toBe(1)
    })

    it('getFromStore with computed id is reactive', async () => {
      const records = [
        { id: 2, description: 'Test Feathers-Pinia', isComplete: true },
        { id: 3, description: 'Release Feathers-Pinia', isComplete: true },
      ]
      store.createInStore(records)

      const id = ref(2)
      const result = store.getFromStore(computed(() => id.value))
      id.value = 3
      expect(result.value?.id).toBe(3)
    })

    it('getFromStore retuns null when record not found', async () => {
      const records = [
        { id: 2, description: 'Test Feathers-Pinia', isComplete: true },
        { id: 3, description: 'Release Feathers-Pinia', isComplete: true },
      ]
      store.createInStore(records)

      const result = store.getFromStore(4)
      expect(result.value).toBeNull()
    })

    it('can getFromStore with ref', async () => {
      store.createInStore(record)
      const result = store.getFromStore(ref(1))
      expect(result.value?.id).toBe(1)
    })

    it('can createInStore with plain object', async () => {
      store.createInStore(record)
      expect(store.items.length).toBe(1)
    })

    it('can createInStore with ref', async () => {
      store.createInStore(ref(record))
      expect(store.items.length).toBe(1)
    })

    it('can createInStore with plain array', async () => {
      const records = [
        { id: 2, description: 'Test Feathers-Pinia', isComplete: true },
        { id: 3, description: 'Release Feathers-Pinia', isComplete: true },
      ]
      store.createInStore(records)
      expect(store.items.length).toBe(2)
    })

    it('can createInStore with array of refs', async () => {
      const records = [
        ref({ id: 2, description: 'Test Feathers-Pinia', isComplete: true }),
        ref({ id: 3, description: 'Release Feathers-Pinia', isComplete: true }),
      ]
      store.createInStore(records)
      expect(store.items.length).toBe(2)
    })

    it('can createInStore with ref holding array of objects', async () => {
      const records = [
        { id: 2, description: 'Test Feathers-Pinia', isComplete: true },
        { id: 3, description: 'Release Feathers-Pinia', isComplete: true },
      ]
      store.createInStore(ref(records))
      expect(store.items.length).toBe(2)
    })

    it('can createInStore with ref holding array of refs', async () => {
      const records = [
        ref({ id: 2, description: 'Test Feathers-Pinia', isComplete: true }),
        ref({ id: 3, description: 'Release Feathers-Pinia', isComplete: true }),
      ]
      store.createInStore(ref(records))
      expect(store.items.length).toBe(2)
    })

    it('can patchInStore single item by id', async () => {
      store.createInStore(record)
      const item = store.patchInStore(1, { description: 'foo' })
      expect(item.id).toBe(1)
      expect(item.description).toBe('foo')
    })

    it('can patchInStore single item with ref id', async () => {
      store.createInStore(record)
      const item = store.patchInStore(ref(1), { description: 'foo' })
      expect(item.id).toBe(1)
      expect(item.description).toBe('foo')
    })

    it('can patchInStore single item with ref id and ref data', async () => {
      store.createInStore(record)
      const item = store.patchInStore(ref(1), ref({ description: 'foo' }))
      expect(item.id).toBe(1)
      expect(item.description).toBe('foo')
    })

    it('can patchInStore multiple items by id with some non-existing', async () => {
      store.createInStore(records)
      // there is no record with id of 1 in the store
      const items = store.patchInStore([1, 2], { description: 'foo' })
      expect(items.length).toBe(1)
      items.forEach((item: any) => {
        expect(item.description).toBe('foo')
      })
    })

    it('can patchInStore multiple by ref array of mixed ref ids with some non-existing', async () => {
      store.createInStore(records)
      // there is no record with id of 1 in the store
      const items = store.patchInStore(ref([ref(1), 2]), ref({ description: 'foo' }))
      expect(items.length).toBe(1)
      items.forEach((item: any) => {
        expect(item.description).toBe('foo')
      })
    })

    it('can patchInStore multiple items by id where all exist', async () => {
      store.createInStore(records)
      const items = store.patchInStore([2, 3], { description: 'foo' })
      expect(items.length).toBe(2)
      items.forEach((item: any) => {
        expect(item.description).toBe('foo')
      })
    })

    it('can patchInStore multiple by ref array of mixed ref ids with some non-existing', async () => {
      store.createInStore(records)
      const items = store.patchInStore(ref([ref(2), 3]), ref({ description: 'foo' }))
      expect(items.length).toBe(2)
      items.forEach((item: any) => {
        expect(item.description).toBe('foo')
      })
    })

    it('can patchInStore upsert multiple items', async () => {
      const items = store.patchInStore(records, ref({ description: 'foo' }))
      expect(items.length).toBe(2)
      items.forEach((item: any) => {
        expect(item.description).toBe('foo')
      })
    })

    it('can patchInStore upsert multiple items ref', async () => {
      const items = store.patchInStore(ref(records), ref({ description: 'foo' }))
      expect(items.length).toBe(2)
      items.forEach((item: any) => {
        expect(item.description).toBe('foo')
      })
    })

    it('can patchInStore multiple items', async () => {
      store.createInStore(records)
      const items = store.patchInStore(ref(records), ref({ description: 'foo' }))
      expect(items.length).toBe(2)
      items.forEach((item: any) => {
        expect(item.description).toBe('foo')
      })
    })

    it('can patchInStore multiple items by query', async () => {
      store.createInStore(records)
      const items = store.patchInStore(null, ref({ description: 'foo' }), { query: { id: { $in: [2, 3] } } })
      expect(items.length).toBe(2)
      items.forEach((item: any) => {
        expect(item.description).toBe('foo')
      })
    })

    it('cannot patchInStore multiple items with an empty query', async () => {
      store.createInStore(records)
      try {
        store.patchInStore(null, ref({ description: 'foo' }), { query: {} })
        expect(false)
      } catch (err) {
        expect(err.message.includes('cannot perform multiple patchInStore with an empty query'))
      }
    })
  })

  describe('instance api', () => {
    it('instances without id get a tempId', async () => {
      const task = store.new({ description: 'foo' })
      expect(task.id).toBeUndefined()
      expect(typeof task.__tempId).toBe('string')
      expect(task.__isTemp).toBe(true)
    })

    test('instances are not automatically added to the store when calling new', async () => {
      const task = store.new(record)
      expect(task).toBeDefined()
      const stored = store.getFromStore(1)
      expect(stored.value).toBeNull()
    })

    test('can add instances to the store', async () => {
      const task = store.new(record)
      task.createInStore()
      const stored = store.getFromStore(1)
      expect(stored.value?.id).toBe(1)
    })

    test('instances intact after clone', async () => {
      const task = store.new(record)
      const clone = task.clone()
      expect(clone.id).toBe(1)
      expect(clone.__isClone).toBe(true)
    })

    test('instances intact after commit', async () => {
      const task = store.new(record)
      const clone = task.clone()
      clone.description = 'foo'
      const committed = clone.commit()
      expect(committed.id).toBe(1)
      expect(committed.description).toBe('foo')
      expect(committed.__isClone).toBe(false)
    })

    test('instances intact after removeFromStore', async () => {
      const task = store.new(record)
      task.createInStore()

      const clone = task.clone()
      clone.description = 'foo'
    })

    test('instances are still instances after findInStore', async () => {
      const task = store.new(record)
      expect(task.__isStoreInstance).toBe(true)

      const added = task.createInStore()
      expect(added.__isStoreInstance).toBe(true)

      const { data } = store.findInStore({ query: {} })
      expect(data.value[0].__isStoreInstance).toBe(true)
    })
  })
})
