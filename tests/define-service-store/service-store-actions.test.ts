import { createPinia } from 'pinia'
import { setupFeathersPinia } from '../../src/index'
import { api } from '../feathers'
import { resetStores } from '../test-utils'

const pinia = createPinia()

const { defineStore, BaseModel } = setupFeathersPinia({ clients: { api } })

class Message extends BaseModel {
  id?: number
  __tempId?: number
  text: string
  otherText?: string

  constructor(data: Partial<Message>, options: Record<string, any> = {}) {
    super(data, options)
    this.init(data)
  }
}
const servicePath = 'messages'
const useMessages = defineStore({ servicePath, Model: Message })

const messagesStore = useMessages(pinia)

const reset = () => resetStores(api.service('messages'), messagesStore)

describe('Store Actions', () => {
  beforeEach(() => reset())
  afterEach(() => reset())

  test('addToStore incrementally updates item in tempsById', () => {
    const message = new Message({ text: 'this is a test' })
    const itemInStore = messagesStore.addToStore(message)
    const tempId: any = itemInStore.__tempId

    expect(itemInStore).toBe(messagesStore.tempsById[tempId])
    expect(itemInStore.id).toBeUndefined()
    expect(itemInStore.text).toBe('this is a test')
    expect(itemInStore.otherText).toBeUndefined()

    const messageWithMoreKeys = Object.assign({}, itemInStore, { otherText: 'added' })
    messagesStore.addToStore(messageWithMoreKeys)
    expect(itemInStore.otherText).toBe('added')
  })

  test('addToStore incrementally updates item in itemsById', () => {
    const message = new Message({ id: 0, text: 'this is a test' })

    messagesStore.addToStore(message)

    const itemInStore = messagesStore.itemsById[0]
    expect(itemInStore.id).toBe(0)
    expect(itemInStore.text).toBe('this is a test')
    expect(itemInStore.otherText).toBeUndefined()

    const messageWithMoreKeys = Object.assign({}, message, { otherText: 'added' })
    messagesStore.addToStore(messageWithMoreKeys)
    expect(itemInStore.otherText).toBe('added')
  })

  test('non-paginated data is still returned as response.data', async () => {
    // Turn off pagination
    const oldPaginateOptions = messagesStore.service.options.paginate
    messagesStore.service.options.paginate = false

    await new Message({ text: 'this is a test' }).save()
    await new Message({ text: 'this is a test' }).save()
    await new Message({ text: 'this is a test' }).save()

    const response = await messagesStore.find({ query: {} })

    expect(Array.isArray(response.data)).toBeTruthy()

    // Turn pagination back on
    messagesStore.service.options.paginate = oldPaginateOptions
  })
})
