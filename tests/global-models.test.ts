import { computed } from 'vue'
import { createPinia } from 'pinia'
import { setupFeathersPinia, models } from '../src/index'
import { api } from './feathers'
import { resetStores } from './test-utils'

const pinia = createPinia()

const { defineStore, BaseModel } = setupFeathersPinia({ clients: { api } })

class Message extends BaseModel {}
const useMessagesService = defineStore({ servicePath: 'messages', Model: Message })

describe('Global Models', () => {
  afterEach(() => {
    delete models.api
  })
  test('calling useStore adds the models by client alias and modelName', () => {
    useMessagesService(pinia)
    expect(models.api.Message).toBeDefined()
  })
})
