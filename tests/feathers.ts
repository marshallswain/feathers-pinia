import type { Tasks, TasksData, TasksQuery } from './feathers-schema-tasks'
import feathers, { HookContext, Params } from '@feathersjs/feathers'
import rest from '@feathersjs/rest-client'
import { memory, MemoryService } from '@feathersjs/memory'
import axios from 'axios'
import auth from '@feathersjs/authentication-client'
import { timeout } from './test-utils'
import { NotAuthenticated } from '@feathersjs/errors'
import type { AdapterParams } from '@feathersjs/adapter-commons'

const restClient = rest()

// @ts-expect-error todo
export const api: any = feathers().configure(restClient.axios(axios)).configure(auth())

api.authentication.service.hooks({
  before: {
    create: [
      async (context: HookContext) => {
        const { data } = context
        if (data.accessToken === 'invalid') {
          throw new NotAuthenticated('invalid token')
        } else if (data.strategy === 'jwt') {
          context.result = {
            accessToken: 'jwt-access-token',
            payload: { test: true },
            user: { id: 1, email: 'test@test.com' },
          }
        }
      },
    ],
    remove: [
      async (context: HookContext) => {
        context.result = {}
      },
    ],
  },
})

interface TasksParams extends AdapterParams<TasksQuery> {
  skipStore?: boolean
}
class TaskService<ServiceParams extends Params = TasksParams> extends MemoryService<Tasks, TasksData, ServiceParams> {}
api.use('tasks', new TaskService({ paginate: { default: 10, max: 100 }, whitelist: ['$options'], id: '_id' }))

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
api.service('tasks').hooks(hooks)
api.service('users').hooks(hooks)
api.service('messages').hooks(hooks)
