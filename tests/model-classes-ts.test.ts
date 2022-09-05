/* eslint-disable @typescript-eslint/no-unused-vars */
import { setupFeathersPinia, BaseModel } from '../src/index' // from 'feathers-pinia'
import { createPinia } from 'pinia'
import { api } from './feathers'

export class User extends BaseModel {
  _id: number
  name: string

  messages?: Partial<Message>[]
}

// With TypeScript, only define the interface directly on the Model, without defaults
export class Message extends BaseModel {
  _id: number
  text = '' // text will always be empty string, even if you provide a value, which sucks for boilerplate elimination.
  text2: string
  userId: null | number
  createdAt: Date | null

  // Values added in `setupInstance` should be declared without a default value, like this:
  user?: Partial<User>

  // Don't provide default values in the Model. They overwrite any passed-in, instanceDefaults, or setupInstance keys that match.
  user2?: Partial<User> = { name: 'Larry' }

  static instanceDefaults(data) {
    return {
      text2: '',
    }
  }

  static setupInstance(instance: Message) {
    const { store, models } = this

    // This will get overwritten by the default `user2` value in the Class definition
    instance.user2 = { name: 'Marshall' }

    return instance
  }
}

const pinia = createPinia()
const { defineStore } = setupFeathersPinia({ clients: { api } })

const servicePath = 'messages'
const useMessagesService = defineStore({ servicePath, Model: Message })
const messagesService = useMessagesService(pinia)

describe('Model Classes Using TypeScript', () => {
  const resetStore = () => {
    api.service('messages').store = {}
  }
  beforeAll(() => resetStore())
  afterAll(() => resetStore())

  test('class defaults even overwrite passed-in values, which sucks for boilerplate elimination', async () => {
    const message = new Message({ text: 'Here I am!' })
    message.userId = 0
    expect(message.text).toBe('')
  })

  test('instanceDefaults are great for boilerplate elimination, they are overwritten by passed data', async () => {
    const message = new Message({ text2: 'Here I am!' })
    message.userId = 0
    expect(message.text2).toBe('Here I am!')
  })

  test('default values kick in if nothing was passed', async () => {
    const message = new Message()
    message.userId = 0
    expect(message.text).toBe('')
  })

  test("message.user has no default value because it is in the Model's TypeScript interface", async () => {
    const message = await messagesService.create({})
    expect(message.user).toBe(undefined)
  })

  test('class defaults overwrite setupInstance', async () => {
    const message = await messagesService.create({})
    expect(message.user2?.name).toBe('Larry')
  })
})
