/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Params } from '@feathersjs/feathers/lib'
import type { ComputedRef, Ref } from 'vue-demi'
import { setupFeathersPinia, BaseModel, associateFind } from '../src/index' // from 'feathers-pinia'
import { createPinia } from 'pinia'
import { api } from './feathers'
import { resetStores } from './test-utils'

interface AssociateFindUtils<M extends BaseModel> {
  params?: Ref<Params> // imperatively modify params?
  findInStore: (params?: Params) => any // access other values that don't match the above params.
  find: (params?: Params) => any // manually re-find with the current params (not watched, by default)
  lastFindAt: number // timestamp

  // Pagination Utils
  paginateOn?: Ref<'server' | 'client'>
  next?: () => void
  prev?: () => void
  toPage?: () => void
  canNext?: ComputedRef<boolean>
  canPrev?: ComputedRef<boolean>
  currentPage?: ComputedRef<number>
  itemsCount?: ComputedRef<number>
  pageCount?: ComputedRef<number>
  toStart?: () => void
  toEnd?: () => void
}

export class User extends BaseModel {
  id: number
  name: string

  messages?: Partial<Message>[]
}

export class Message extends BaseModel {
  id: number
  text: string
  userId: null | number
  stargazerIds: number[]
  createdAt: Date | null
  handleSetInstanceRan: boolean

  // Properties added by associateFind
  stargazers: Partial<User>[]
  _stargazers: AssociateFindUtils<User>

  // findStargazers: any

  constructor(data: Partial<Message>, options: Record<string, any> = {}) {
    super(data, options)
    this.init(data)
  }

  static instanceDefaults(data) {
    return {
      text: '',
      userId: null,
      stargazerIds: [] as User[],
      createdAt: null,
    }
  }

  static setupInstance(message: Message) {
    const { store, models } = this

    associateFind(message, 'stargazers', {
      Model: models.api.User,
      makeParams: (message) => ({
        query: { $or: [{ id: { $in: message.stargazerIds } }, { _tempId: { $in: message.stargazerIds } }] },
      }),
      handleSetInstance(user) {
        this.handleSetInstanceRan = true
        const id = user.getAnyId()
        if (id && !this.stargazerIds.includes(id)) this.stargazerIds.push(id)
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
  test('data is found at [prop].data', async () => {
    const message = new Message({}).addToStore() as Message
    expect(message.stargazers).toEqual([])
  })

  test('values added by associatedFind default to an empty array when no related data is present', async () => {
    const message = new Message({}).addToStore() as Message
    expect(message.stargazers).toEqual([])
  })

  test('bogus ids will still return an empty array (no local data to populate)', async () => {
    const message = new Message({ stargazerIds: [1, 2, 3] }).addToStore() as Message
    expect(message.stargazers).toEqual([])
  })

  test("pre-populated data gets added to the associated Model's store", async () => {
    const stargazers = [
      { id: 1, name: 'Marshall' },
      { id: 2, name: 'David' },
      { id: 3, name: 'Beau' },
    ]
    const message = new Message({ stargazerIds: [1, 2, 3], stargazers }).addToStore() as Message
    const populatedStargazers = JSON.parse(JSON.stringify(message.stargazers))
    expect(populatedStargazers).toEqual(stargazers)
  })
})

describe('AssociateFind Utils', () => {
  //
  test('utils are added at underscored prop, like `_stargazers`', async () => {
    const message = new Message({}).addToStore() as Message
    expect(message._stargazers).toBeDefined()
  })

  test('utils include a `find` method', () => {
    const message = new Message({}).addToStore() as Message
    expect(typeof message._stargazers.find).toBe('function')
  })

  test('utils include a `findInStore` method', () => {
    const message = new Message({}).addToStore() as Message
    expect(typeof message._stargazers.findInStore).toBe('function')
  })
})

describe('Fetching Associated Data', () => {
  //
  test('instances have a "findItems" method based on the prop name', async () => {
    const message = new Message({}).addToStore() as Message
    expect(message._stargazers).toBeDefined()
  })

  test('can find associated data directly from the instance', async () => {
    const message = new Message({ stargazerIds: [4, 5, 6] }).addToStore() as Message
    const result = await message._stargazers.find()
    expect(result.data.length).toBe(3)
    expect(result.data.map((i) => i.id)).toEqual([4, 5, 6])
  })

  test('returns empty results if there is no data matching the params given to `associateFind`', async () => {
    const message = new Message({}).addToStore() as Message
    const result = await message._stargazers.find()
    expect(result.data.length).toEqual(0)
    expect(result.data.map((i) => i.id)).toEqual([])
  })
})

describe('Writing to the Association Attribute', () => {
  //
  test('writing records to the association triggers the handleSetInstance callback', async () => {
    const stargazers = [{ id: 1, name: 'Marshall' }]
    const message = new Message({}).addToStore() as Message
    message.stargazers = stargazers
    expect(message.handleSetInstanceRan).toBeTruthy()
  })

  test('after passing through handleSetInstance, the data can be retrieved from the store.', async () => {
    const stargazers = [
      { id: 1, name: 'Marshall' },
      { id: 2, name: 'David' },
      { id: 3, name: 'Beau' },
    ]
    const message = new Message({}).addToStore() as Message
    message.stargazers = stargazers
    expect(message.stargazerIds).toEqual([1, 2, 3])
    expect(message.stargazers.length).toBe(3)
    expect(message.stargazers).toEqual(stargazers)
  })

  test('associations are maintained for records without ids (which get tempIds) and the query in makeParams includes _tempId', async () => {
    const message = new Message({}).addToStore() as Message

    // Write data without an id to the `stargazers` setter
    message.stargazers = [{ name: 'Rocketman' }]
    const gazer: User = message.stargazers[0] as User
    const id = gazer.getAnyId()
    expect(id).toBeTruthy()
  })
})

describe('Saving Instance', () => {
  test('assocations are not included during save', async () => {
    let hadAssociatedData = false
    const message = new Message({ stargazerIds: [4, 5, 6] }).addToStore() as Message

    // Populate the stargazers and make sure they show up through the getter.
    await message._stargazers.find()
    expect(message.stargazers.length).toBe(3)

    // Use a hook to make sure `stargazers` isn't sent to the API server.
    const hook = (context) => {
      if (context.data.stargazers) {
        hadAssociatedData = true
      }
      return context
    }
    api.service('messages').hooks({ before: { create: [hook] } })

    expect(hadAssociatedData).toBeFalsy()
  })

  test('assocated data must be manually saved', async () => {
    const message = new Message({ stargazerIds: [4, 5, 6] }).addToStore() as Message
    await message._stargazers.find()
    const results = await message.stargazers.map((g) => (g as User).save())
    expect(results?.length).toBe(3)
  })
})

describe('Cloning Associations', () => {
  test('associated data is still present after clone', async () => {
    const message = new Message({ stargazerIds: [4, 5, 6] }).addToStore() as Message
    await message._stargazers.find()
    const clone = message.clone()
    expect(message.stargazers?.length).toEqual(clone.stargazers?.length)
  })

  test('associated data is still present after clone/commit', async () => {
    const message = new Message({ stargazerIds: [4, 5, 6] }).addToStore() as Message
    await message._stargazers.find()
    const clone = message.clone()
    const original = clone.commit()
    expect(original.stargazers?.length).toEqual(clone.stargazers?.length)
  })

  test('associated data is still present after clone/re-clone/reset', async () => {
    const message = new Message({ stargazerIds: [4, 5, 6] }).addToStore() as Message
    await message._stargazers.find()
    const clone = message.clone()

    const clone2 = clone.clone()
    expect(clone2).toEqual(clone)
    expect(clone2.stargazers?.length).toEqual(clone.stargazers?.length)

    const clone3 = clone.clone()
    expect(clone3).toEqual(clone)
    expect(clone3.stargazers?.length).toEqual(clone.stargazers?.length)
  })
})

// describe('Paginating Assocations', () => {})
