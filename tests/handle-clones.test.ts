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
  beforeEach(() => reset())

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

  describe('save_handlers with temp records', () => {
    test('temp record: save_handler with no arguments calls create when value is unchanged', async () => {
      const hook = jest.fn()
      api.service(servicePath).hooks({
        before: {
          create: [hook],
        },
      })
      const message = new Message({ text: 'about to save with string' })
      const props = { message }
      const { clones, saveHandlers } = handleClones(props)
      const { save_message } = saveHandlers
      const { areEqual, wasDataSaved, item } = await save_message()

      expect(hook).toHaveBeenCalledTimes(1)
      expect(areEqual).toBe(false)
      expect(wasDataSaved).toBe(true)
      expect(item.text).toBe('about to save with string')
    })

    test('temp record: save_handler with string calls create when value is unchanged', async () => {
      const hook = jest.fn()
      api.service(servicePath).hooks({
        before: {
          create: [hook],
        },
      })
      const message = new Message({ text: 'about to save with string' })
      const props = { message }
      const { clones, saveHandlers } = handleClones(props)
      const { save_message } = saveHandlers
      const { areEqual, wasDataSaved, item } = await save_message('text')

      expect(hook).toHaveBeenCalledTimes(1)
      expect(areEqual).toBe(false)
      expect(wasDataSaved).toBe(true)
      expect(item.text).toBe('about to save with string')
    })

    test('temp record: save_handler with string calls create after value change', async () => {
      const hook = jest.fn()
      api.service(servicePath).hooks({
        before: {
          create: [hook],
        },
      })
      const message = new Message({ text: 'about to save with string' })
      const props = { message }
      const { clones, saveHandlers } = handleClones(props)
      const { save_message } = saveHandlers
      clones.message.text = 'hi'
      const { areEqual, wasDataSaved, item } = await save_message('text')

      expect(hook).toHaveBeenCalledTimes(1)
      expect(areEqual).toBe(false)
      expect(wasDataSaved).toBe(true)
      expect(item.text).toBe('hi')
    })

    test('temp record: save_handler with array calls create when value is unchanged', async () => {
      const hook = jest.fn()
      api.service(servicePath).hooks({
        before: {
          create: [hook],
        },
      })
      const text = 'about to save with an array of attribute names'
      const message = new Message({ text })
      const props = { message }
      const { clones, saveHandlers } = handleClones(props)
      const { save_message } = saveHandlers
      const { areEqual, wasDataSaved, item } = await save_message(['text'])

      expect(hook).toHaveBeenCalledTimes(1)
      expect(areEqual).toBe(false)
      expect(wasDataSaved).toBe(true)
      expect(item.text).toBe(text)
    })

    test('temp record: save_handler with array calls create after value change', async () => {
      const hook = jest.fn()
      api.service(servicePath).hooks({
        before: {
          create: [hook],
        },
      })
      const message = new Message({ text: 'about to save with an array of attribute names' })
      const props = { message }
      const { clones, saveHandlers } = handleClones(props)
      const { save_message } = saveHandlers
      clones.message.text = 'hi'
      const { areEqual, wasDataSaved, item } = await save_message(['text'])

      expect(hook).toHaveBeenCalledTimes(1)
      expect(areEqual).toBe(false)
      expect(wasDataSaved).toBe(true)
      expect(item.text).toBe('hi')
    })

    test('temp record: save_handler with object calls create when value is unchanged', async () => {
      const hook = jest.fn()
      api.service(servicePath).hooks({
        before: {
          create: [hook],
        },
      })
      const text = 'about to save with an array of attribute names'
      const message = new Message({ text })
      const props = { message }
      const { clones, saveHandlers } = handleClones(props)
      const { save_message } = saveHandlers
      const { areEqual, wasDataSaved, item } = await save_message({ text })

      expect(hook).toHaveBeenCalledTimes(1)
      expect(areEqual).toBe(false)
      expect(wasDataSaved).toBe(true)
      expect(item.text).toBe(text)
    })

    test('save_handler with array calls create after value change', async () => {
      const hook = jest.fn()
      api.service(servicePath).hooks({
        before: {
          create: [hook],
        },
      })
      const message: any = new Message({ text: 'about to save with an array of attribute names' })
      const props = { message }
      const { clones, saveHandlers } = handleClones(props)
      const { save_message } = saveHandlers
      const { areEqual, wasDataSaved, item } = await save_message({ text: 'save this text' })

      expect(hook).toHaveBeenCalledTimes(1)
      expect(areEqual).toBe(false)
      expect(wasDataSaved).toBe(true)
      expect(item.text).toBe('save this text')
    })
  })

  describe('save_handlers with non-temp records', () => {
    test('save_handler with no arguments does not call patch when value is unchanged', async () => {
      const hook = jest.fn()
      api.service(servicePath).hooks({
        before: {
          patch: [hook],
        },
      })
      const message = await new Message({ text: 'about to save with no arguments' }).save()
      const props = { message }
      const { clones, saveHandlers } = handleClones(props)
      const { save_message } = saveHandlers
      const { areEqual, wasDataSaved, item } = await save_message()

      expect(hook).not.toHaveBeenCalled()
      expect(areEqual).toBe(true)
      expect(wasDataSaved).toBe(false)
      expect(item.text).toBe('about to save with no arguments')
    })

    test('save_handler with no arguments calls patch when value changed', async () => {
      const hook = jest.fn()
      api.service(servicePath).hooks({
        before: {
          patch: [hook],
        },
      })
      const message = await new Message({
        text: 'about to save with no arguments',
        unchangedProp: true,
        changedProp: false,
      }).save()
      const props = { message }
      const { clones, saveHandlers } = handleClones(props)
      const { save_message } = saveHandlers
      Object.assign(clones.message, {
        text: 'foo',
        changedProp: true,
      })
      const { areEqual, wasDataSaved, item } = await save_message()
      const hookCallArgs = hook.mock.calls[0][0]

      expect(hook).toHaveBeenCalledTimes(1)
      expect(hookCallArgs.data).toEqual({ text: 'foo', changedProp: true })
      expect(areEqual).toBe(false)
      expect(wasDataSaved).toBe(true)
      expect(item.text).toBe('foo')
    })

    test('save_handler with no arguments calls patch when value changed, can disable diff', async () => {
      const hook = jest.fn()
      api.service(servicePath).hooks({
        before: {
          patch: [hook],
        },
      })
      const message = await new Message({
        text: 'about to save with no arguments',
        unchangedProp: true,
        changedProp: false,
      }).save()
      const props = { message }
      const { clones, saveHandlers } = handleClones(props)
      const { save_message } = saveHandlers
      Object.assign(clones.message, {
        text: 'foo',
        changedProp: true,
      })
      const { areEqual, wasDataSaved, item } = await save_message(undefined, { diff: false })
      const hookCallArgs = hook.mock.calls[0][0]

      expect(hook).toHaveBeenCalledTimes(1)
      expect(hookCallArgs.data).toEqual({
        text: 'foo',
        changedProp: true,
        id: 0,
        unchangedProp: true,
      })
      expect(areEqual).toBe(false)
      expect(wasDataSaved).toBe(true)
      expect(item.text).toBe('foo')
    })

    test('save_handler with string does not call patch when value unchanged', async () => {
      const hook = jest.fn()
      api.service(servicePath).hooks({
        before: {
          patch: [hook],
        },
      })
      const message = await new Message({ text: 'about to save with string' }).save()
      const props = { message }
      const { clones, saveHandlers } = handleClones(props)
      const { save_message } = saveHandlers
      const { areEqual, wasDataSaved, item } = await save_message('text')

      expect(hook).not.toHaveBeenCalled()
      expect(areEqual).toBe(true)
      expect(wasDataSaved).toBe(false)
      expect(item.text).toBe('about to save with string')
    })

    test('save_handler with string calls patch after value change', async () => {
      const hook = jest.fn()
      api.service(servicePath).hooks({
        before: {
          patch: [hook],
        },
      })
      const message = await new Message({ text: 'about to save with string' }).save()
      const props = { message }
      const { clones, saveHandlers } = handleClones(props)
      const { save_message } = saveHandlers
      clones.message.text = 'hi'
      const { areEqual, wasDataSaved, item } = await save_message('text')

      expect(hook).toHaveBeenCalledTimes(1)
      expect(areEqual).toBe(false)
      expect(wasDataSaved).toBe(true)
      expect(item.text).toBe('hi')
    })

    test('save_handler with array does not call patch when value is unchanged', async () => {
      const hook = jest.fn()
      api.service(servicePath).hooks({
        before: {
          patch: [hook],
        },
      })
      const text = 'about to save with an array of attribute names'
      const message = new Message({ text })
      const props = { message }
      const { clones, saveHandlers } = handleClones(props)
      const { save_message } = saveHandlers
      const { areEqual, wasDataSaved, item } = await save_message(['text'])

      expect(hook).not.toHaveBeenCalled()
      expect(areEqual).toBe(false)
      expect(wasDataSaved).toBe(true)
      expect(item.text).toBe(text)
    })

    test('save_handler with array calls patch after value change', async () => {
      const hook = jest.fn()
      api.service(servicePath).hooks({
        before: {
          patch: [hook],
        },
      })
      const message = await new Message({
        text: 'about to save with an array of attribute names',
      }).save()
      const props = { message }
      const { clones, saveHandlers } = handleClones(props)
      const { save_message } = saveHandlers
      clones.message.text = 'hi'
      const { areEqual, wasDataSaved, item } = await save_message(['text'])

      expect(hook).toHaveBeenCalledTimes(1)
      expect(areEqual).toBe(false)
      expect(wasDataSaved).toBe(true)
      expect(item.text).toBe('hi')
    })

    test('save_handler with object does not call patch when value is unchanged', async () => {
      const hook = jest.fn()
      api.service(servicePath).hooks({
        before: {
          patch: [hook],
        },
      })
      const text = 'about to save with an array of attribute names'
      const message = await new Message({ text }).save()
      const props = { message }
      const { clones, saveHandlers } = handleClones(props)
      const { save_message } = saveHandlers
      const { areEqual, wasDataSaved, item } = await save_message({ text })

      expect(hook).not.toHaveBeenCalled()
      expect(areEqual).toBe(true)
      expect(wasDataSaved).toBe(false)
      expect(item.text).toBe(text)
    })

    test('save_handler with object calls patch after value change', async () => {
      const hook = jest.fn()
      api.service(servicePath).hooks({
        before: {
          patch: [hook],
        },
      })
      const message: any = await new Message({
        text: 'about to save with an array of attribute names',
      }).save()
      const props = { message }
      const { clones, saveHandlers } = handleClones(props)
      const { save_message } = saveHandlers
      const { areEqual, wasDataSaved, item } = await save_message({ text: 'save this text' })

      expect(hook).toHaveBeenCalledTimes(1)
      expect(areEqual).toBe(false)
      expect(wasDataSaved).toBe(true)
      expect(item.text).toBe('save this text')
    })
  })
})
