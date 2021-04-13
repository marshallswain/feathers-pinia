import { createPinia } from 'pinia'
import { setup, models } from '../src/index'
import { api } from './feathers'
import { resetStores } from './test-utils'

const pinia = createPinia()

const { defineStore, BaseModel } = setup({ pinia, clients: { api } })

const servicePath = 'messages'
const useMessagesService = defineStore({ servicePath })

const messagesService = useMessagesService()

const reset = () => resetStores(api.service('messages'), messagesService)

describe('Temporary Records (Local-Only)', () => {
  beforeEach(() => reset())
  afterEach(() => reset())

  test('records without idField get __tempId added', () => {
    const message = messagesService.add({ text: 'this is a test' })
    expect(typeof message.__tempId).toBe('string')
  })

  test('records with idField do not get __tempId added', () => {
    const message = messagesService.add({ id: 2, text: 'this is a test' })
    expect(message.__tempId).toBeUndefined()
  })

  test('temps are added to tempsById', () => {
    const message = messagesService.add({ text: 'this is a test' })
    expect(messagesService.tempsById).toHaveProperty(message.__tempId)
  })

  test('saving a temp removes __tempId', async () => {
    const message = await messagesService.add({ text: 'this is a test' }).save()
    expect(message.__tempId).toBeUndefined()
  })

  test('saving a temp removes it from tempsById', async () => {
    let message = messagesService.add({ text: 'this is a test' })
    const tempId = message.__tempId
    message = await message.save()
    expect(messagesService.tempsById).not.toHaveProperty(tempId)
  })
})
