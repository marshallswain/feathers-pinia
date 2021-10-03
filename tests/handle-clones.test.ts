import { createPinia } from 'pinia'
import { setupFeathersPinia, models } from '../src/index'
import { api } from './feathers'
import { handleClones } from '../src/handle-clones'
import { resetStores, timeout } from './test-utils'

const pinia = createPinia()

const { defineStore, BaseModel } = setupFeathersPinia({ clients: { api } })

class Message extends BaseModel {
  static instanceDefaults() {
    return { text: '' }
  }
}

const servicePath = 'messages'
const useMessagesService = defineStore({ servicePath, Model: Message })

const messagesService = useMessagesService(pinia)

const reset = () => resetStores(api.service('messages'), messagesService)

describe('Handle clones test', () => {
  beforeAll(() => reset())

  test('it returns a clone', async () => {
    const message = await messagesService.create({ text: 'Quick, what is the number to 911?' })
    const props = { message }
    const { clones } = handleClones(props)
    expect(clones.message).toHaveProperty('__isClone')
    expect(clones.message.__isClone).toBe(true)
    expect(message === clones.message).toBe(false)
  })

  test('can update via save handler', async () => {
    const message = await messagesService.create({ text: 'Quick, what is the number to 911?' })
    const props = { message }
    const { saveHandlers, clones } = handleClones(props)
    const { save_message } = saveHandlers
    clones.message.text = 'Doh! it is 911!'
    const { item } = await save_message(['text'])
    expect(item.text).toBe('Doh! it is 911!')
  })

  test('only accepts valid service models', async () => {
    const message = await messagesService.create({ text: 'Quick, what is the number to 911?' })
    const booleanField = true
    const props = { message, booleanField }
    const { clones } = handleClones(props)
    expect(clones.booleanField).toBeUndefined()
  })

  test('adds new instances to the store', async () => {
    const message = new Message({ text: 'I will soon go to the store.' })
    expect(messagesService.tempIds).toHaveLength(0)
    const props = { message }
    const { clones } = handleClones(props)
    expect(messagesService.tempIds).toHaveLength(1)
  })
})
