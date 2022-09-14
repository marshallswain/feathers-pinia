import feathers, { HookContext } from '@feathersjs/feathers'
import rest from '@feathersjs/rest-client'
import { memory } from '@feathersjs/memory'
import axios from 'axios'
import auth from '@feathersjs/authentication-client'
import { timeout } from './test-utils'

const restClient = rest()

// @ts-expect-error todo
export const api: any = feathers().configure(restClient.axios(axios)).configure(auth())

api.authentication.service.hooks({
  before: {
    create: [
      (context: HookContext) => {
        const { data } = context
        if (data.strategy === 'jwt') {
          context.result = { accessToken: 'jwt-access-token', payload: { test: true } }
        }
      },
    ],
  },
})

api.use('users', memory({ paginate: { default: 10, max: 100 }, whitelist: ['$options'] }))
api.use('messages', memory({ paginate: { default: 10, max: 100 }, whitelist: ['$options'] }))
api.use('alt-ids', memory({ paginate: { default: 10, max: 100 }, whitelist: ['$options'], id: '_id' }))
api.use('custom-ids', memory({ paginate: { default: 10, max: 100 }, whitelist: ['$options'], id: 'my-id' }))
api.use('todos', memory({ paginate: { default: 10, max: 100 }, whitelist: ['$options'] }))

const hooks = {
  before: {
    find: [
      async () => {
        await timeout(0)
      },
    ],
  },
}
api.service('users').hooks(hooks)
api.service('messages').hooks(hooks)
