import feathers from '@feathersjs/feathers'
import memory from 'feathers-memory'

export const api = feathers()

api.use('messages', memory())
api.use('users', memory())
