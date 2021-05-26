import { computed } from 'vue'
import { createPinia } from 'pinia'
import { setup } from '../src/index'
import { api } from './feathers'
import { resetStores, timeout } from './test-utils'
import { useFind } from '../src/use-find'

const pinia = createPinia()

describe('whitelist', () => {
  test('adds whitelist to the state', async () => {
    const { defineStore, BaseModel } = setup({ pinia, clients: { api }, whitelist: ['$regex'] })

    const useMessagesService = defineStore({ servicePath: 'messages' })
    const messagesService = useMessagesService()

    expect(messagesService.whitelist[0]).toBe('$regex')
  })

  test('find getter fails without whitelist', async () => {
    const { defineStore, BaseModel } = setup({ pinia, clients: { api } })

    const useLettersService = defineStore({ servicePath: 'letters' })
    const lettersService = useLettersService()

    const fn = () => lettersService.findInStore({ query: { $regex: 'test' } })

    expect(fn).toThrowError()
  })

  test('enables custom query params for the find getter', async () => {
    const { defineStore, BaseModel } = setup({ pinia, clients: { api }, whitelist: ['$regex'] })

    const useMessagesService = defineStore({ servicePath: 'messages' })
    const messagesService = useMessagesService()

    const data = messagesService.findInStore({ query: { $regex: 'test' } }).data

    expect(Array.isArray(data)).toBeTruthy()
  })
})
