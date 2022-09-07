import { vi } from 'vitest'
import { createPinia } from 'pinia'
import { setupFeathersPinia } from '../src/index'
import { api } from './feathers'
import { resetStores } from './test-utils'

const pinia = createPinia()

const { defineStore, BaseModel } = setupFeathersPinia({ clients: { api } })

class Message extends BaseModel {
  id: string
  text = ''
  other = ''
  userId: null | number = null
  createdAt: null | Date = null

  constructor(data: Partial<Message>, options: Record<string, any> = {}) {
    super(data, options)
    this.init(data)
  }
}

const useMessagesService = defineStore({ servicePath: 'messages', Model: Message })
const messageStore = useMessagesService(pinia)

const reset = () => resetStores(api.service('messages'), messageStore)

beforeEach(() => {
  reset()
  api.service('users').store = {
    1: { id: 1, name: 'Marshall' },
    2: { id: 2, name: 'David' },
    3: { id: 3, name: 'Beau' },
    4: { id: 4, name: 'Batman' },
    5: { id: 5, name: 'Flash' },
    6: { id: 6, name: 'Wolverine' },
    7: { id: 7, name: 'Rogue' },
  }
})
afterAll(() => reset())

describe('Clone Patch Diffing', () => {
  //
  test('diff by default ', async () => {
    const message = await new Message({}).save()
    const clone = message.clone()
    clone.text = 'it was the size of texas'
    clone.other = 'foo'

    const hook: any = vi.fn((context) => context)
    api.service('messages').hooks({ before: { patch: [hook] } })

    await clone.save()

    const callData = hook.returns[0].data
    expect(callData).toEqual({ text: 'it was the size of texas', other: 'foo' })
  })

  test('turn diff off with diff:false', async () => {
    const message = await new Message({}).save()
    const clone = message.clone()
    clone.text = 'it was the size of texas'

    const hook: any = vi.fn((context) => context)
    api.service('messages').hooks({ before: { patch: [hook] } })

    await clone.save({ diff: false })

    const callData = hook.returns[0].data
    expect(callData).toEqual({ createdAt: null, id: 0, other: '', text: 'it was the size of texas', userId: null })
  })

  test('diff string', async () => {
    const message = await new Message({}).save()
    const clone = message.clone()
    clone.text = 'it was the size of texas'

    const hook: any = vi.fn((context) => context)
    api.service('messages').hooks({ before: { patch: [hook] } })

    await clone.save({ diff: 'text' })

    const callData = hook.returns[0].data
    expect(callData).toEqual({ text: 'it was the size of texas' })
  })

  test('diff with invalid string produces empty diff, does not send a request', async () => {
    const message = await new Message({}).save()
    const clone = message.clone()
    clone.text = 'it was the size of texas'

    const hook: any = vi.fn((context) => context)
    api.service('messages').hooks({ before: { patch: [hook] } })

    const returned = await clone.save({ diff: 'scooby-doo' })

    expect(returned).toEqual(clone)
    expect(hook).not.toHaveBeenCalled()
  })

  test('diff array of strings', async () => {
    const message = await new Message({}).save()
    const clone = message.clone()
    clone.text = 'it was the size of texas'
    clone.other = 'bar'
    clone.createdAt = new Date() // won't get diffed because it's excluded in params.diff

    const hook: any = vi.fn((context) => context)
    api.service('messages').hooks({ before: { patch: [hook] } })

    await clone.save({ diff: ['text', 'other'] })

    const callData = hook.returns[0].data
    expect(callData).toEqual({ text: 'it was the size of texas', other: 'bar' })
  })

  test('diff array of strings, only one value changed', async () => {
    const message = await new Message({}).save()
    const clone = message.clone()
    clone.text = 'it was the size of texas'

    const hook: any = vi.fn((context) => context)
    api.service('messages').hooks({ before: { patch: [hook] } })

    await clone.save({ diff: ['text', 'other'] })

    const callData = hook.returns[0].data
    expect(callData).toEqual({ text: 'it was the size of texas' })
  })

  test('diff with object', async () => {
    const message = await new Message({}).save()
    const clone = message.clone()
    clone.other = 'foo'

    const hook: any = vi.fn((context) => context)
    api.service('messages').hooks({ before: { patch: [hook] } })

    await clone.save({ diff: { text: 'happy birthday', other: 'bar' } })

    const callData = hook.returns[0].data
    expect(callData).toEqual({ text: 'happy birthday', other: 'bar' })
  })
})

describe('Diff and `with", Always Include "with" Values', () => {
  test('"with" string', async () => {
    const message = await new Message({}).save()
    const clone = message.clone()
    clone.text = 'it was the size of texas'

    const hook: any = vi.fn((context) => context)
    api.service('messages').hooks({ before: { patch: [hook] } })

    await clone.save({ diff: 'text', with: 'other' })

    const callData = hook.returns[0].data
    expect(callData).toEqual({ text: 'it was the size of texas', other: '' })
  })

  test('"with" array', async () => {
    const message = await new Message({}).save()
    const clone = message.clone()
    clone.text = 'it was the size of texas'
    clone.other = 'foo'

    const hook: any = vi.fn((context) => context)
    api.service('messages').hooks({ before: { patch: [hook] } })

    await clone.save({ diff: 'text', with: ['other'] })

    const callData = hook.returns[0].data
    expect(callData).toEqual({ text: 'it was the size of texas', other: 'foo' })
  })

  test('"with" object', async () => {
    const message = await new Message({}).save()
    const clone = message.clone()
    clone.text = 'it was the size of texas'
    clone.other = 'foo'

    const hook: any = vi.fn((context) => context)
    api.service('messages').hooks({ before: { patch: [hook] } })

    await clone.save({ diff: 'text', with: { other: 'bar' } })

    const callData = hook.returns[0].data
    expect(callData).toEqual({ text: 'it was the size of texas', other: 'bar' })
  })
})

describe('Eager Updates', () => {
  test('eager updates are reversed if saving fails', async () => {
    const message = await new Message({ text: 'hi', other: 'there', userId: null, createdAt: null }).save()
    const clone = message.clone()
    clone.text = 'it was the size of texas'

    let hasHookRun = false

    const hook = () => {
      if (!hasHookRun) {
        hasHookRun = true
        throw new Error('fail')
      }
    }
    api.service('messages').hooks({ before: { patch: [hook] } })

    return clone.save({ diff: 'text', with: 'other' }).catch(() => {
      expect(message).toEqual({
        id: 0,
        text: 'hi',
        other: 'there',
        userId: null,
        createdAt: null,
      })
    })
  })
})
