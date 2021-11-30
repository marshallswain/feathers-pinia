import { createPinia } from 'pinia'
import { setupFeathersPinia, clients } from '../src/index'
import { api } from './feathers'

createPinia()

describe('Global Clients', () => {
  test('calling setup adds the clients by key name', () => {
    setupFeathersPinia({ clients: { api } })
    expect(clients.api).toBeDefined()
  })
})
