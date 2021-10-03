import { createPinia } from 'pinia'
import { setupFeathersPinia } from '../src/index'
import type { AnyData, ModelInstanceOptions } from '../src/service-store/types'
import { api } from './feathers'
import { models } from '../src/models'

const pinia = createPinia()

const { defineStore, BaseModel } = setupFeathersPinia({ clients: { api } })

class Message extends BaseModel {
  // This doesn't work as a default value. It will overwrite all passed-in values and always be this value.
  text = 'The text in the model always wins. You can only overwrite it after instantiation'

  static instanceDefaults(data: Message) {
    return {
      text: 'this gets overwritten by the class-level `text`',
      otherText: `this won't get overwritten and works great for a default value`
    }
  }
}

class Mensaje extends BaseModel {
  // This doesn't work as a default value. It will overwrite all passed-in values and always be this value.
  text = 'The default value of text can be overridden because we have implemented a constructor in this class'

  constructor(data: AnyData, options: ModelInstanceOptions = {}) {
    // You must call `super` very first to instantiate the BaseModel
    super(data, options)

    const { store, instanceDefaults, setupInstance } = this.constructor as typeof BaseModel

    // Assign the default values again, because you can override this class's defaults inside this class's `constructor`.
    Object.assign(this, instanceDefaults(data, { models, store })) // only needed when this class implements `instanceDefaults`
    Object.assign(this, setupInstance(data, { models, store })) // only needed when this class implements `setupInstance`
    return this
  }

  static instanceDefaults(data: Message) {
    return {
      text: 'this overwrites the class-level text, because we re-assign the values in this class\'s constructor',
      otherText: `this won't get overwritten and works great for a default value, too.`
    }
  }
}

const servicePath = 'messages'
const useMessagesService = defineStore({ servicePath, Model: Message })

const messagesService = useMessagesService(pinia)

const resetStore = () => (api.service('messages').store = {})

describe('Model Instance Defaults', () => {
  beforeAll(() => resetStore())
  afterAll(() => resetStore())

  test('class-level defaults do not work because they overwrite provided data', async () => {
    const message = await messagesService.create({
      text: 'this text will be overwritten by the value in the Message class.'
    })
    expect(message.text).toBe(
      'The text in the model always wins. You can only overwrite it after instantiation'
    )
  })

  test('use instanceDefaults for default values', async () => {
    const message = await messagesService.create({})
    expect(message.otherText).toBe(`this won't get overwritten and works great for a default value`)
  })
})
