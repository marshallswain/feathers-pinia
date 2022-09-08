import { createPinia } from 'pinia'
import { setupFeathersPinia, useClone } from '../src/index'
import { api } from './feathers'
import { resetStores } from './test-utils'
import { reactive } from 'vue'

const pinia = createPinia()
const { defineStore, BaseModel } = setupFeathersPinia({ clients: { api } })

class Message extends BaseModel {
  text: string
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

describe('useClone', () => {
  beforeEach(() => reset())

  test('it returns a clone', async () => {
    const props = {
      message: await messagesService.create({ text: 'hello' }),
    }
    const clone = useClone(props, 'message')

    expect(clone.value?.__isClone).toBe(true)
    expect(clone.value === props.message).toBe(false)
  })

  test('passing a clone returns a clone', async () => {
    const message = await messagesService.create({ text: 'hello' })
    const messageClone = message.clone()

    const props = reactive({ message: messageClone })

    const clone = useClone(props, 'message')

    expect(clone.value?.__isClone).toBe(true)
  })

  test('only clones BaseModel instances', async () => {
    const props = {
      message: await messagesService.create({ text: 'hello' }),
      booleanField: true,
    }
    const clone = useClone(props, 'booleanField')

    expect(clone.value).toBeNull()
  })

  test('adds new instances to the store upon read', async () => {
    const props = {
      message: new Message({ text: 'hi' }),
    }
    const clone = useClone(props, 'message')

    expect(clone.value).toBeDefined() // Must read the value to add to the store
    expect(messagesService.tempIds).toHaveLength(1)
  })

  test('it re-clones if the prop is set to a different instance', async () => {
    const props = reactive({
      message: await messagesService.create({ text: 'hi' }),
    })

    const clone = useClone<Message>(props, 'message')

    props.message = await messagesService.create({ text: 'something different' })

    // Wait for the watcher to run
    await setTimeout(Promise.resolve, 20)

    expect(clone.value?.text).toBe('something different')
  })

  test('it does not re-clone if the prop is set to the same instance', async () => {
    const message = await messagesService.create({ text: 'hi' })
    const props = reactive({ message })

    const clone = useClone<Message>(props, 'message')

    // Write some values to the clone
    Object.assign(clone.value as Message, {
      text: 'howdy-edited',
      other: 'edited',
    })

    props.message = message

    // Wait for the watcher to run
    await setTimeout(Promise.resolve, 20)

    expect(clone.value?.text).toBe('howdy-edited')
  })

  test('does not re-clone if original properties change', async () => {
    const props = reactive({
      message: await messagesService.create({ text: 'howdy' }),
    })

    const clone = useClone<Message>(props, 'message')
    expect(clone.value?.text).toBe('howdy')

    // Write some values to the clone
    Object.assign(clone.value as Message, {
      text: 'howdy-edited',
      other: 'edited',
    })

    // Change the original
    props.message.text = 'something different'

    // Wait for the watcher to run
    await setTimeout(Promise.resolve, 20)

    // Clone values did not get reset
    expect(clone.value?.text).toBe('howdy-edited')
    expect(clone.value?.other).toBe('edited')
  })

  test('re-clones if a different record is provided in the props', async () => {
    const props = reactive({
      message: await messagesService.create({ text: 'howdy' }),
    })

    const clone = useClone<Message>(props, 'message')
    expect(clone.value?.text).toBe('howdy')

    // Write some values to the clone
    Object.assign(clone.value as Message, {
      text: 'howdy-edited',
      other: 'edited',
    })

    // Change the original
    props.message = await messagesService.create({ text: 'something different' })

    // Wait for the watcher to run
    await setTimeout(Promise.resolve, 20)

    // Clone values updated to match the new value of prop.message
    expect(clone.value?.text).toBe('something different')
    expect(clone.value?.other).toBeUndefined()
  })

  test('can use deep:true to re-clone when original properties change', async () => {
    const props = reactive({
      message: await messagesService.create({ text: 'howdy' }),
    })

    const clone = useClone<Message>(props, 'message', { deep: true })
    expect(clone.value?.text).toBe('howdy')

    Object.assign(clone.value as Message, {
      text: 'howdy-edited',
      other: 'edited',
    })

    props.message.text = 'something different'

    // Wait for the watcher to run
    await setTimeout(Promise.resolve, 20)

    expect(clone.value?.text).toBe('something different')
    expect(clone.value?.other).toBeUndefined()
  })

  test('props can initially be null', async () => {
    interface Props {
      message: Message | null
    }
    const props = reactive<Props>({
      message: null,
    })

    const clone = useClone<Message>(props, 'message')
    expect(clone.value).toBeNull()

    props.message = await messagesService.create({ text: 'updated' })

    // Wait for the watcher to run
    await setTimeout(Promise.resolve, 20)

    expect(clone.value?.text).toBe('updated')
  })

  test('props can return to be null', async () => {
    interface Props {
      message: Message | null
    }
    const props = reactive<Props>({
      message: await messagesService.create({ text: 'howdy' }),
    })

    const clone = useClone<Message>(props, 'message')
    expect(clone.value?.text).toBe('howdy')

    props.message = null

    // Wait for the watcher to run
    await setTimeout(Promise.resolve, 20)

    expect(clone.value).toBeNull()
  })
})

describe('Simultanous Usage in Separate Components', () => {
  test('without `useExisting` option, second component resets the first', async () => {
    interface Props {
      message: Message | null
    }
    const props = reactive<Props>({
      message: await messagesService.create({ text: 'howdy' }),
    })

    // Clone the data in the first component
    const clone = useClone<Message>(props, 'message')

    // Make changes to the data in the first component
    Object.assign(clone.value as Message, {
      text: 'howdy-edited',
      other: 'edited',
    })

    // Clone the data in the second component
    const clone2 = useClone<Message>(props, 'message')
    expect(clone2.value?.text).toBe('howdy')
    expect(clone2.value?.other).toBeUndefined()
  })

  test('with `useExisting: true`, second component reuses the existing clone', async () => {
    interface Props {
      message: Message | null
    }
    const props = reactive<Props>({
      message: await messagesService.create({ text: 'howdy' }),
    })

    // Clone the data in the first component
    const clone = useClone<Message>(props, 'message')

    // Make changes to the data in the first component
    Object.assign(clone.value as Message, {
      text: 'howdy-edited',
      other: 'edited',
    })

    // Clone the data in the second component
    const clone2 = useClone<Message>(props, 'message', { useExisting: true })

    expect(clone2.value?.text).toBe('howdy-edited')
    expect(clone2.value?.other).toBe('edited')
  })
})
