import { createPinia } from 'pinia'
import { setupFeathersPinia } from '../src/setup'
import { api } from './feathers'
import { resetStores } from './test-utils'

const pinia = createPinia()

export const { defineStore, BaseModel } = setupFeathersPinia({
  clients: { api },
  idField: '_id',
  whitelist: ['$regex', '$options'],
})

class User extends BaseModel { }

const useUsersStore = defineStore({
  servicePath: 'users',
  Model: User,
  state: () => ({
    firstName: 'Bob',
    lastName: 'Smith',
    age: 20
  }),
  getters: {
    fullName: state => `${state.firstName} ${state.lastName}`,
  },
  actions: {
    greet() {
      console.log(`Hello ${this.fullName}`)
      return `Hello ${this.fullName}`
    }
  }
})
const store = useUsersStore(pinia)
console.log(store.$state)

describe('Define Users Store', () => {
  test('can interact with store', async () => {
    expect(store.firstName).toBe('Bob')
    expect(store.fullName).toBe('Bob Smith')
    expect(store.greet()).toBe('Hello Bob Smith')
    store.firstName = 'John'
    expect(store.firstName).toBe('John')
    expect(store.fullName).toBe('John Smith')
    expect(store.greet()).toBe('Hello John Smith')
  })
})
