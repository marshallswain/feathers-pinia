import { createPinia } from 'pinia'
import { setupFeathersPinia, useClones } from '../src/index'
import { api } from './feathers'
import { resetStores } from './test-utils'
import { reactive } from 'vue'

const pinia = createPinia()
const { defineStore, BaseModel } = setupFeathersPinia({ clients: { api } })

class Message extends BaseModel {
  text = ''
  other?: string

  constructor(data: Partial<Message>, options: Record<string, any> = {}) {
    super(data, options)
    this.init(data)
  }
}

const servicePath = 'messages'
const useMessagesService = defineStore({ servicePath, Model: Message })
const messagesService = useMessagesService(pinia)
const reset = () => resetStores(api.service('messages'), messagesService)

describe('useClones', () => {
  beforeEach(() => reset())

  test('it returns clones', async () => {
    const props = {
      message: await messagesService.create({ text: 'hi' }),
      msg: await messagesService.create({ text: 'hi' }),
    }
    const clones = useClones(props)

    Object.keys(props).forEach((prop) => {
      expect(clones[prop].value.__isClone).toBe(true)
      expect(props[prop] === clones[prop].value).toBe(false)
    })
  })

  test('only clones BaseModel instances', async () => {
    const props = {
      message: await messagesService.create({ text: 'hi' }),
      booleanField: true,
    }
    const { message, booleanField } = useClones(props)
    expect(message.value?.text).toBe('hi')
    expect(booleanField.value).toBeNull()
  })

  test('adds new instances to the store', async () => {
    const message = new Message({ text: 'I will soon go to the store.' })
    expect(messagesService.tempIds).toHaveLength(0)

    const props = { message }
    useClones(props)

    expect(messagesService.tempIds).toHaveLength(1)
  })

  test('can use deep:true to re-clone when original properties change', async () => {
    const props = reactive({
      message: await messagesService.create({ text: 'howdy' }),
    })

    const { message } = useClones(props, { deep: true })

    expect(message.value?.text).toBe('howdy')

    Object.assign(message.value as Message, {
      text: 'howdy-edited',
      other: 'edited',
    })

    props.message.text = 'something different'

    // Wait for the watcher to run
    await setTimeout(Promise.resolve, 20)

    expect(message.value?.text).toBe('something different')
    expect(message.value?.other).toBeUndefined()
  })

  test('can use useExisting:true to re-clone when original properties change', async () => {
    const props = reactive({
      message: await messagesService.create({ text: 'howdy' }),
    })

    const { message } = useClones(props, { useExisting: true })

    expect(message.value?.text).toBe('howdy')

    Object.assign(message.value as Message, {
      text: 'howdy-edited',
      other: 'edited',
    })

    const { message: message2 } = useClones(props, { useExisting: true })

    // Wait for the watcher to run
    await setTimeout(Promise.resolve, 20)

    expect(message2.value?.text).toBe('howdy-edited')
    expect(message2.value?.other).toBe('edited')
  })
})
