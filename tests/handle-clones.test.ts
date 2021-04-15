import { createPinia } from 'pinia'
import { setup, models } from '../src/index'
import { api } from './feathers'
import { handleClones } from '../src/handle-clones'
import { resetStores, timeout } from './test-utils'

const pinia = createPinia()

const { defineStore, BaseModel } = setup({ pinia, clients: { api } })

const servicePath = 'messages'
const useMessagesService = defineStore({ servicePath })

const messagesService = useMessagesService()

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
})
