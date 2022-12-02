/* eslint-disable @typescript-eslint/no-unused-vars */
import { setupFeathersPinia, BaseModel } from '../../src/index'
import { createPinia } from 'pinia'
import { api } from '../feathers'

const pinia = createPinia()
const { defineStore } = setupFeathersPinia({ clients: { api } })

export class Message extends BaseModel {
  text1 = 'Class Defaults'
  text2 = 'Class Defaults'
  text3 = 'Class Defaults'

  constructor(data: Partial<Message>, options: Record<string, any> = {}) {
    super(data, options)
    this.init(data)
  }

  static instanceDefaults(data: Partial<Message>) {
    return {
      text1: 'Instance Defaults',
      text2: 'Instance Defaults',
    }
  }

  static setupInstance(data: Partial<Message>) {
    const { models, store } = this
  }
}

new Message({ text1: '' })

const useMessagesService = defineStore({ servicePath: 'messages', Model: Message })
const messagesService = useMessagesService(pinia)

const resetStore = () => {
  api.service('messages').store = {}
}
beforeAll(() => resetStore())
afterAll(() => resetStore())

describe('Model Classes Custom Constructor', () => {
  test('passed in values overwrite defaults', async () => {
    const message = await messagesService.create({ text1: 'Provided Text' })
    expect(message.text1).toBe('Provided Text')
  })

  test('instanceDefaults overwrites model class defaults', async () => {
    const message = await messagesService.create({})
    expect(message.text2).toBe('Instance Defaults')
  })

  test('class defaults work when there is no matching instanceDefault or provided value', async () => {
    const message = await messagesService.create({})
    expect(message.text3).toBe('Class Defaults')
  })
})
