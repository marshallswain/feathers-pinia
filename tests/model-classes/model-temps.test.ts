import { createPinia } from 'pinia'
import { setupFeathersPinia } from '../../src/index'
import { api } from '../feathers'
import { resetStores } from '../test-utils'

const pinia = createPinia()

const { defineStore } = setupFeathersPinia({ clients: { api } })

const useMessagesService = defineStore({ servicePath: 'messages' })
const useTodosService = defineStore({ servicePath: 'todos', tempIdField: '__customTempId' })

const messagesService = useMessagesService(pinia)
const todosService = useTodosService(pinia)

const storesToTest = [
  {
    servicePath: 'messages',
    store: messagesService,
    expectedTempIdField: '__tempId',
  },
  {
    servicePath: 'todos',
    store: todosService,
    expectedTempIdField: '__customTempId',
  },
]

storesToTest.forEach(({ servicePath, store, expectedTempIdField }, i) => {
  const reset = () => resetStores(api.service(servicePath), store)
  describe.skip(`Temporary Records (Local-Only) - ${i === 0 ? 'default' : 'custom'} tempIdField`, () => {
    beforeEach(() => reset())
    afterEach(() => reset())

    test('default tempIdField is __tempId', () => {
      expect(store).toHaveProperty('tempIdField')
      expect(store.tempIdField).toBe(expectedTempIdField)
    })

    test('records without idField get tempIdField added', () => {
      const item = store.addToStore({ text: 'this is a test' })
      const { tempIdField } = store
      expect(typeof item[tempIdField]).toBe('string')
    })

    test('records without idField have __isTemp of true', () => {
      const item = store.addToStore({ text: 'this is a test' })
      expect(item.__isTemp).toBe(true)
    })

    test('records with idField do not get tempIdField added', () => {
      const item = store.addToStore({ id: 2, text: 'this is a test' })
      const { tempIdField } = store
      expect(item[tempIdField]).toBeUndefined()
    })

    test('temps can be retrieved with getFromStore', () => {
      const item = store.addToStore({ text: 'this is a test' })
      const { tempIdField } = store
      const fromTempStore = store.getFromStore(item[tempIdField])
      expect(fromTempStore?.[tempIdField]).toBe(item[tempIdField])
    })

    test('temps are added to tempsById', () => {
      const item = store.addToStore({ text: 'this is a test' })
      const { tempIdField } = store
      expect(store.tempsById).toHaveProperty(item[tempIdField])
    })

    test('saving a temp removes tempIdField', async () => {
      const item = await store.addToStore({ text: 'this is a test' }).save()
      const { tempIdField } = store
      expect(item[tempIdField]).toBeUndefined()
    })

    test('saving a temp removes it from tempsById', async () => {
      let item = store.addToStore({ text: 'this is a test' })
      const { tempIdField } = store
      const tempId = item[tempIdField]
      item = await item.save()
      expect(store.tempsById).not.toHaveProperty(tempId)
    })

    test('find getter returns temps when params.temps === true', async () => {
      store.addToStore({ text: 'this is a test' })
      const data = store.findInStore({ query: {}, temps: true }).data
      expect(data.length).toBe(1)
    })

    test('find getter does not returns temps when params.temps is falsy', async () => {
      store.addToStore({ text: 'this is a test' })
      const data = store.findInStore({ query: {} }).data
      expect(data.length).toBe(0)
    })

    test('temps can be removed from the store', async () => {
      const item = store.addToStore({ text: 'this is a test' })
      const { tempIdField } = store
      const tempId = item[tempIdField]
      item.removeFromStore()
      expect(store.tempsById).not.toHaveProperty(tempId)
    })

    test('can clone a temp', () => {
      const item = store.addToStore({ text: 'this is a test' })
      item.clone()
      const { tempIdField } = store
      expect(store.clonesById).toHaveProperty(item[tempIdField])
    })

    test('can commit a temp clone', () => {
      const item = store.addToStore({ text: 'this is a test' })
      item.clone({ foo: 'bar' }).commit()
      const { tempIdField } = store
      expect(store.tempsById[item[tempIdField]]).toHaveProperty('foo')
    })
  })
})
