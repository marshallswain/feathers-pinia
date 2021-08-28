import { computed } from 'vue'
import { createPinia } from 'pinia'
import { setupFeathersPinia, clients } from '../src/index'
import { api } from './feathers'
import { resetStores } from './test-utils'

const pinia = createPinia()

describe('Global Clients', () => {
  test('calling setup adds the clients by key name', () => {
    const { defineStore, BaseModel } = setupFeathersPinia({ clients: { api } })
    expect(clients.api).toBeDefined()
  })
})
