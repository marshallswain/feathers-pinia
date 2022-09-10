/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Ref } from 'vue-demi'
import type { Id } from '@feathersjs/feathers/lib'
import { setupFeathersPinia, BaseModel, associateGet, type Params } from '../src/index' // from 'feathers-pinia'
import { createPinia } from 'pinia'
import { api } from './feathers'
import { resetStores } from './test-utils'

interface AssociateGetUtils<M extends BaseModel> {
  params?: Ref<Params> // imperatively modify params?
  getFromStore: (id?: Id, params?: Params) => M | null // access a different record, when needed.
  get: (id?: Id, params?: Params) => M // manually re-get with the provided id. (not watch, by default)
  lastGetAt: number // timestamp
}

export class User extends BaseModel {
  id: number
  name: string
}

export class Message extends BaseModel {
  id: number
  text = ''
  userId: null | number = null
  handleSetInstanceRan = false

  // Properties added by associateGet
  user: Partial<User>
  _user: AssociateGetUtils<User>

  constructor(data: Partial<Message>, options: Record<string, any> = {}) {
    super(data, options)
    this.init(data)
  }

  static setupInstance(message: Message) {
    const { store, models } = this

    associateGet(message, 'user', {
      Model: models.api.User,
      getId(message) {
        return message.userId as number
      },
      // makeParams: (message) => ({
      //   query: { $or: [{ id: { $in: message.stargazerIds } }, { _tempId: { $in: message.stargazerIds } }] },
      // }),
      handleSetInstance(user) {
        this.handleSetInstanceRan = true
        const id = user.getAnyId()
        if (id) this.userId = id
      },
    })

    return message
  }
}

const pinia = createPinia()
const { defineStore } = setupFeathersPinia({ clients: { api } })

const useUsersService = defineStore({ servicePath: 'users', Model: User })
const userStore = useUsersService(pinia)

const useMessagesService = defineStore({ servicePath: 'messages', Model: Message })
const messageStore = useMessagesService(pinia)

const reset = () => {
  resetStores(api.service('messages'), messageStore)
  resetStores(api.service('users'), userStore)
}

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

describe('Populated Data', () => {
  //
  test('values added by associatedGet default to null when no related data is present', async () => {
    const message = new Message({}).addToStore() as Message
    expect(message.user).toBe(null)
  })

  test('a bogus id will still return null (no local data to populate)', async () => {
    const message = new Message({ userId: 1 }).addToStore() as Message
    expect(message.user).toBe(null)
  })

  test("pre-populated data gets added to the associated Model's store", async () => {
    const user = { id: 1, name: 'Marshall' }
    const message = new Message({ userId: 1, user }).addToStore() as Message
    const populatedUser = JSON.parse(JSON.stringify(message.user))
    expect(populatedUser).toEqual(user)
  })
})

describe('AssociateGet Utils', () => {
  //
  test('utils are added at underscored prop, like `_user`', async () => {
    const message = new Message({}).addToStore() as Message
    expect(message._user).toBeDefined()
  })

  test('utils include a `get` method', () => {
    const message = new Message({}).addToStore() as Message
    expect(typeof message._user.get).toBe('function')
  })

  test('utils include a `findInStore` method', () => {
    const message = new Message({}).addToStore() as Message
    expect(typeof message._user.getFromStore).toBe('function')
  })
})

describe('Fetching Associated Data', () => {
  test('instances have a "getItem" method based on the prop name', async () => {
    const message = new Message({}).addToStore() as Message
    expect(typeof message._user.get).toBe('function')
  })

  test('can get associated data directly from the instance', async () => {
    const message = new Message({ userId: 4 }).addToStore() as Message
    const result = await message._user.get()
    expect(result.id).toBe(4)
  })

  test('throws 404 if not found', async () => {
    const message = new Message({}).addToStore() as Message
    try {
      await message._user.get()
    } catch (error: any) {
      expect(error.code).toBe(404)
    }
  })
})

describe('Writing to the Association Attribute', () => {
  test('writing a record to the association triggers the handleSetInstance callback', async () => {
    const user = { id: 1, name: 'Marshall' }
    const message = new Message({}).addToStore() as Message
    message.user = user
    expect(message.handleSetInstanceRan).toBeTruthy()
    expect(message.userId).toBe(1)
  })

  test('after passing through handleSetInstance, the data can be retrieved from the store.', async () => {
    const user = { id: 1, name: 'Marshall' }
    const message = new Message({}).addToStore() as Message
    message.user = user
    expect(message.user).toEqual(user)
  })

  test('associations also work for records temp records', async () => {
    const user = { name: 'Marshall' }
    const message = new Message({}).addToStore() as Message
    // Write data without an id to the `user` setter
    message.user = user
    const tempId = (message.user as User).getAnyId()
    expect(tempId).toBe(message.userId)
    expect(typeof tempId).toBe('string')
  })
})

describe('Saving Instance', () => {
  test('assocations are not included during save', async () => {
    let hadAssociatedData = false
    const message = new Message({ userId: 4 }).addToStore() as Message
    // Populate the user and make sure it shows up through the getter.
    await message._user.get()
    expect(message.user.id).toBe(4)
    // Use a hook to make sure `user` isn't sent to the API server.
    const hook = (context) => {
      if (context.data.user) {
        hadAssociatedData = true
      }
      return context
    }
    api.service('messages').hooks({ before: { create: [hook] } })
    expect(hadAssociatedData).toBeFalsy()
  })

  test('assocated data must be manually saved', async () => {
    const message = new Message({ userId: 5 }).addToStore() as Message
    await message._user.get()
    const result = await (message.user as User)?.save()
    expect(result.id).toBe(5)
  })
})

describe('Cloning Associations', () => {
  test('associated data is still present after clone', async () => {
    const message = new Message({ userId: 6 }).addToStore() as Message
    await message._user.get()
    const clone = message.clone()
    expect(message.user).toEqual(clone.user)
  })

  test('associated data is still present after clone/commit', async () => {
    const message = new Message({ userId: 4 }).addToStore() as Message
    await message._user.get()
    const clone = message.clone()
    const original = clone.commit()
    expect(original.user).toEqual(clone.user)
  })

  test('associated data is still present after clone/re-clone/reset', async () => {
    const message = new Message({ userId: 4 }).addToStore() as Message
    await message._user.get()

    const clone = message.clone()

    const clone2 = clone.clone()
    expect(clone2).toEqual(clone)
    expect(clone2.user).toEqual(clone.user)

    const clone3 = clone.clone()
    expect(clone3).toEqual(clone)
    expect(clone3.user).toEqual(clone.user)
  })
})

// describe('Paginating Assocations', () => {})
