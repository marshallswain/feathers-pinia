import feathers from '@feathersjs/feathers'
import memory from 'feathers-memory'

export const api = feathers()
const service = memory({
  paginate: {
    default: 10,
    max: 100,
  },
})

api.use('messages', service)
api.use('users', memory())
