import { createPinia } from 'pinia'
import { setupFeathersPinia } from '../src/setup'
import { api } from './feathers'

const pinia = createPinia()

export const { defineStore, BaseModel } = setupFeathersPinia({
  clients: { api },
  idField: '_id',
  whitelist: ['$regex', '$options'],
})

class User extends BaseModel {}

const storeOptions = {
  Model: User,
  state: () => ({
    firstName: 'Bob',
    lastName: 'Smith',
    age: 20,
  }),
  getters: {
    fullName: (state: any): string => `${state.firstName} ${state.lastName}`,
  },
  actions: {
    greet(): string {
      return 'Hello from action'
    }
  }
}

describe('Define Store 1 (from options without options.id)', () => {
  const useUsersStore = defineStore({ servicePath: 'users', ...storeOptions })
  const store = useUsersStore(pinia)

  test('can interact with store', async () => {
    expect(store.$id).toBe('service.users')
    expect(store.servicePath).toBe('users')
    expect(store.firstName).toBe('Bob')
    expect(store.fullName).toBe('Bob Smith')
    expect(store.greet()).toBe('Hello from action')
    store.firstName = 'John'
    expect(store.firstName).toBe('John')
    expect(store.fullName).toBe('John Smith')
    expect(store.greet()).toBe('Hello from action')
  })
})

describe('Define Store 2 (from options with options.id)', () => {
  const useUsersStore = defineStore({ id: 'users2', servicePath: 'users', ...storeOptions })
  const store = useUsersStore(pinia)

  test('can interact with store', async () => {
    expect(store.$id).toBe('users2')
    expect(store.servicePath).toBe('users')
    expect(store.firstName).toBe('Bob')
    expect(store.fullName).toBe('Bob Smith')
    expect(store.greet()).toBe('Hello from action')
    store.firstName = 'John'
    expect(store.firstName).toBe('John')
    expect(store.fullName).toBe('John Smith')
    expect(store.greet()).toBe('Hello from action')
  })
})

describe('Define Store 3 (from id and options without options.id)', () => {
  const useUsersStore = defineStore('users3', { servicePath: 'users', ...storeOptions })
  const store = useUsersStore(pinia)

  test('can interact with store', async () => {
    expect(store.$id).toBe('users3')
    expect(store.servicePath).toBe('users')
    expect(store.firstName).toBe('Bob')
    expect(store.fullName).toBe('Bob Smith')
    expect(store.greet()).toBe('Hello from action')
    store.firstName = 'John'
    expect(store.firstName).toBe('John')
    expect(store.fullName).toBe('John Smith')
    expect(store.greet()).toBe('Hello from action')
  })
})

describe('Define Store 4 (from id and options with options.id)', () => {
  const useUsersStore = defineStore('users4', { id: 'should-be-overriden', servicePath: 'users', ...storeOptions })
  const store = useUsersStore(pinia)

  test('can interact with store', async () => {
    expect(store.$id).toBe('users4')
    expect(store.servicePath).toBe('users')
    expect(store.firstName).toBe('Bob')
    expect(store.fullName).toBe('Bob Smith')
    expect(store.greet()).toBe('Hello from action')
    store.firstName = 'John'
    expect(store.firstName).toBe('John')
    expect(store.fullName).toBe('John Smith')
    expect(store.greet()).toBe('Hello from action')
  })
})
