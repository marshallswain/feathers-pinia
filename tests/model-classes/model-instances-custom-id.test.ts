import { createPinia } from 'pinia'
import { setupFeathersPinia } from '../../src/index'
import { api } from '../feathers'
import { resetStores } from '../test-utils'

const pinia = createPinia()

const { defineStore, BaseModel } = setupFeathersPinia({ clients: { api } })

class AltId extends BaseModel {
  _id: number
  text: string

  constructor(data: Partial<AltId>, options: Record<string, any> = {}) {
    super(data, options)
    this.init(data)
  }
}
const useAltIds = defineStore({ servicePath: 'alt-ids', Model: AltId, idField: '_id' })
const altIdStore = useAltIds(pinia)

class CustomId extends BaseModel {
  'my-id': number
  text: string

  constructor(data: Partial<CustomId>, options: Record<string, any> = {}) {
    super(data, options)
    this.init(data)
  }
}
const useCustomIds = defineStore({ servicePath: 'custom-ids', Model: CustomId, idField: 'my-id' })
const customIdStore = useCustomIds(pinia)

const reset = () => {
  resetStores(api.service('alt-ids'), altIdStore)
  resetStores(api.service('custom-ids'), customIdStore)
}

describe('Works with _id', () => {
  // Clear the store before and after each test.
  beforeEach(() => {
    reset()
    // Populate some data with `_id` attributes.
    api.service('alt-ids').store = {
      1: { _id: 1, text: 'Hey' },
      2: { _id: 2, text: 'Hey' },
      3: { _id: 3, text: 'Hey what?' },
      4: { _id: 4, text: 'You said hey first' },
    }
  })
  afterEach(() => reset())

  test('creating an instance does NOT add it to the altIdStore', () => {
    new AltId({ _id: 0, text: 'this is a test' })

    expect(altIdStore.itemsById[0]).toBeUndefined()
    expect(altIdStore.tempsById[0]).toBeUndefined()
  })

  test('calling instance.addToStore() adds it to itemsById when the data contains an id', () => {
    const message = new AltId({ _id: 0, text: 'this is a test' })

    message.addToStore()

    expect(altIdStore.itemsById[0]).toBeTruthy()
  })

  test('calling instance.addToStore() adds it to tempsById when the record contains no id', () => {
    const message = new AltId({ text: 'this is a test' })

    message.addToStore()

    expect(altIdStore.itemsById[0]).toBeUndefined()
    expect(Object.keys(altIdStore.tempsById)).toHaveLength(1)
  })

  test('new instances have truthy __isTemp', () => {
    const message = new AltId({ text: 'this is a test' })

    expect(message.__isTemp).toBeTruthy
    message.addToStore()
    expect(message.__isTemp).toBeFalsy
  })

  test('fetching data from the server populates the items into the store', async () => {
    await altIdStore.find({ query: {} })
    expect(altIdStore.items.length).toBe(4)
  })

  describe('_id after create', () => {
    test('non-reactive records have id after save', async () => {
      const message = new AltId({ text: 'this is a test' })
      await message.save()
      expect(message._id).toBeDefined()
    })
  })
})

describe('Works with Custom ID', () => {
  // Clear the store before and after each test.
  beforeEach(() => {
    reset()
    // Populate some data with custom `my-id` attributes.
    api.service('custom-ids').store = {
      1: { 'my-id': 1, text: 'Hey' },
      2: { 'my-id': 2, text: 'Hey' },
      3: { 'my-id': 3, text: 'Hey what?' },
      4: { 'my-id': 4, text: 'You said hey first' },
    }
  })
  afterEach(() => reset())

  test('creating an instance does NOT add it to the customIdStore', () => {
    new CustomId({ 'my-id': 0, text: 'this is a test' })

    expect(customIdStore.itemsById[0]).toBeUndefined()
    expect(customIdStore.tempsById[0]).toBeUndefined()
  })

  test('calling instance.addToStore() adds it to itemsById when the data contains an id', () => {
    const message = new CustomId({ 'my-id': 0, text: 'this is a test' })

    message.addToStore()

    expect(customIdStore.itemsById[0]).toEqual(message)
  })

  test('calling instance.addToStore() adds it to tempsById when the record contains no id', () => {
    const message = new CustomId({ text: 'this is a test' })

    message.addToStore()

    expect(customIdStore.itemsById[0]).toBeUndefined()
    expect(Object.keys(customIdStore.tempsById)).toHaveLength(1)
  })

  test('new instances have truthy __isTemp', () => {
    const message = new CustomId({ text: 'this is a test' })

    expect(message.__isTemp).toBeTruthy
    message.addToStore()
    expect(message.__isTemp).toBeFalsy
  })

  test('fetching data from the server populates the items into the store', async () => {
    await customIdStore.find({ query: {} })
    expect(customIdStore.items.length).toBe(4)
  })

  describe('my-id after create', () => {
    test('non-reactive records have id after save', async () => {
      const message = new CustomId({ text: 'this is a test' })
      await message.save()
      expect(message['my-id']).toBeDefined()
    })
  })
})
