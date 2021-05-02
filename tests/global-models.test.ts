import { computed } from 'vue'
import { createPinia } from 'pinia'
import { setup, models } from '../src/index'
import { api } from './feathers'
import { resetStores } from './test-utils'

const pinia = createPinia()

const { defineStore, BaseModel } = setup({ pinia, clients: { api } })

class Message extends BaseModel {}
const useMessagesService = defineStore({ servicePath: 'messages', Model: Message })

describe('Global Models', () => {
  test('calling defineStore adds the models by client alias and modelName', () => {
    expect(models.api.Message).toBeDefined()
  })
})
