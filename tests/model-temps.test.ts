import { createPinia } from 'pinia'
import { setupFeathersPinia, models } from '../src/index'
import { api } from './feathers'
import { resetStores } from './test-utils'

const pinia = createPinia()

const { defineStore, BaseModel } = setupFeathersPinia({ clients: { api } })

const servicePath = 'messages'
const useMessagesService = defineStore({ servicePath })

const messagesService = useMessagesService(pinia)

const reset = () => resetStores(api.service('messages'), messagesService)

describe('Temporary Records (Local-Only)', () => {
  beforeEach(() => reset())
  afterEach(() => reset())

  test('records without idField get __tempId added', () => {
    const message = messagesService.addToStore({ text: 'this is a test' })
    expect(typeof message.__tempId).toBe('string')
  })

  test('records with idField do not get __tempId added', () => {
    const message = messagesService.addToStore({ id: 2, text: 'this is a test' })
    expect(message.__tempId).toBeUndefined()
  })

  test('temps are added to tempsById', () => {
    const message = messagesService.addToStore({ text: 'this is a test' })
    expect(messagesService.tempsById).toHaveProperty(message.__tempId)
  })

  test('saving a temp removes __tempId', async () => {
    const message = await messagesService.addToStore({ text: 'this is a test' }).save()
    expect(message.__tempId).toBeUndefined()
  })

  test('saving a temp removes it from tempsById', async () => {
    let message = messagesService.addToStore({ text: 'this is a test' })
    const tempId = message.__tempId
    message = await message.save()
    expect(messagesService.tempsById).not.toHaveProperty(tempId)
  })

  test('find getter returns temps when params.temps === true', async () => {
    const message = messagesService.addToStore({ text: 'this is a test' })
    const data = messagesService.findInStore({ query: {}, temps: true }).data
    expect(data.length).toBe(1)
  })

  test('find getter does not returns temps when params.temps is falsey', async () => {
    const message = messagesService.addToStore({ text: 'this is a test' })
    const data = messagesService.findInStore({ query: {} }).data
    expect(data.length).toBe(0)
  })

  test('temps can be removed from the store', async () => {
    const message = messagesService.addToStore({ text: 'this is a test' })
    const tempId = message.__tempId
    message.removeFromStore()
    expect(messagesService.tempsById).not.toHaveProperty(tempId)
  })

  test('can clone a temp', () => {
    const message = messagesService.addToStore({ text: 'this is a test' })
    message.clone()
    expect(messagesService.clonesById).toHaveProperty(message.__tempId)
  })

  test('can commit a temp clone', () => {
    const message = messagesService.addToStore({ text: 'this is a test' })
    const committed = message.clone({ foo: 'bar' }).commit()
    expect(messagesService.tempsById[message.__tempId]).toHaveProperty('foo')
  })
})
