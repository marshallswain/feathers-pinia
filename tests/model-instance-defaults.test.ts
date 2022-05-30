import { createPinia } from 'pinia'
import { setupFeathersPinia } from '../src/index'
import { api } from './feathers'

const pinia = createPinia()

const { defineStore, BaseModel } = setupFeathersPinia({ clients: { api } })

class Message extends BaseModel {
  // This doesn't work as a default value.
  // It will overwrite all passed-in values and always be this value.
  text = 'The text in the model always wins. You can only overwrite it after instantiation'
  otherText: string

  static instanceDefaults() {
    return {
      text: 'this gets overwritten by the class-level `text`',
      otherText: `this won't get overwritten and works great for a default value`,
    }
  }
}

const servicePath = 'messages'
const useMessagesService = defineStore({ servicePath, Model: Message })

const messagesService = useMessagesService(pinia)

const resetStore = () => {
  api.service('messages').store = {}
}

describe('Model Instance Defaults', () => {
  beforeAll(() => resetStore())
  afterAll(() => resetStore())

  test('class-level defaults do not work because they overwrite provided data', async () => {
    const message = await messagesService.create({
      text: 'this text will be overwritten by the value in the Message class.',
    })
    expect(message.text).toBe(
      'The text in the model always wins. You can only overwrite it after instantiation',
    )
  })

  test('use instanceDefaults for default values', async () => {
    const message = await messagesService.create({})
    expect(message.otherText).toBe(`this won't get overwritten and works great for a default value`)
  })
})
