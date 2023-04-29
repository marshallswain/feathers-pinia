import type { Tasks, TasksData, TasksQuery } from './schemas/tasks'
import type { Users, UsersData } from './schemas/users'
import type { Contacts, ContactsData, ContactsQuery } from './schemas/contacts'
import type { Posts } from './schemas/posts'
import type { Authors } from './schemas/authors'
import type { Comments } from './schemas/comments'

import { feathers, HookContext, Params } from '@feathersjs/feathers'
import { memory, MemoryService } from '@feathersjs/memory'
import { NotAuthenticated } from '@feathersjs/errors'
import { createPinia } from 'pinia'
import { timeout } from '../test-utils'
import { createPiniaClient, defineGetters, defineSetters, useInstanceDefaults } from '../../src'
import rest from '@feathersjs/rest-client'
import axios from 'axios'
import auth from '@feathersjs/authentication-client'
import { makeContactsData } from './data'
import { computed, ref } from 'vue'
import { vi } from 'vitest'
import { AdapterParams } from '@feathersjs/adapter-commons'

const pinia = createPinia()
const restClient = rest()

export const localStorageMock: Storage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}

const paginate = () => ({ default: 10, max: 100 })
const whitelist = () => ['$options']

class CustomMemory extends MemoryService<Users, UsersData, AdapterParams> {
  async customCreate(data: UsersData, params: AdapterParams) {
    const result = await super.create(data, params)
    return { ...result, custom: true }
  }
}

const UserService = new CustomMemory({
  paginate: paginate(),
  whitelist: whitelist(),
})
export const usersMethods = ['find', 'get', 'create', 'patch', 'remove', 'customCreate'] as const

const TaskService = memory<Tasks, TasksData, Params<TasksQuery>>({
  paginate: paginate(),
  whitelist: whitelist(),
  id: '_id',
})
const ContactService = memory<Contacts, ContactsData, Params<ContactsQuery>>({
  paginate: paginate(),
  whitelist: whitelist(),
  store: makeContactsData(),
  id: '_id',
})
const AuthorService = memory({ paginate: paginate(), whitelist: whitelist() })
const PostService = memory({ paginate: paginate(), whitelist: whitelist() })
const CommentService = memory({ paginate: paginate(), whitelist: whitelist() })

interface ServiceTypes {
  users: typeof UserService
  tasks: typeof TaskService
  contacts: typeof ContactService
  authors: typeof AuthorService
  posts: typeof PostService
  comments: typeof CommentService
}

const feathersClient = feathers<ServiceTypes>()
  .configure(restClient.axios(axios))
  .configure(auth())
  .use('tasks', TaskService)
  .use('users', UserService, {
    methods: usersMethods,
  })
  .use('contacts', ContactService)
  .use('authors', AuthorService)
  .use('posts', PostService)
  .use('comments', CommentService)

// hooks to simulate auth responses
feathersClient.authentication.service.hooks({
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

// simulate a very short server wait time
feathersClient.hooks({
  before: {
    all: [
      async () => {
        await timeout(0)
      },
    ],
  },
})

export const api = createPiniaClient(feathersClient, {
  pinia,
  idField: '_id',
  whitelist: ['$regex'],
  syncWithStorage: false,
  storage: localStorageMock,
  paramsForServer: [],
  customizeStore() {
    return {
      globalCustom: true,
      sharedGlobal: ref(false),
      toggleSharedGlobal() {
        this.sharedGlobal = !this.sharedGlobal
      },
    }
  },
  services: {
    users: {
      idField: 'id',
    },
    contacts: {
      defaultLimit: 20,
      whitelist: ['$test'],
      syncWithStorage: ['tempsById'],
      setupInstance(data: any) {
        const withDefaults = useInstanceDefaults({ name: '', age: 0 }, data)
        return withDefaults
      },
      customizeStore(data) {
        const serviceCustom = ref(false)
        const serviceCustomOpposite = computed(() => !serviceCustom.value)
        const itemsLength = computed(() => data.items.value.length)
        function setServiceCustom(val: boolean) {
          serviceCustom.value = val
        }
        const globalCustom = false
        return { serviceCustom, serviceCustomOpposite, itemsLength, setServiceCustom, globalCustom }
      },
    },
    tasks: {
      skipGetIfExists: true,
    },
    authors: {
      idField: 'id',
      setupInstance(author, { app }) {
        const withDefaults = useInstanceDefaults({ setInstanceRan: false }, author)
        const withAssociations = defineGetters(withDefaults, {
          posts(this: Authors) {
            return app.service('posts').useFind({ query: { authorId: this.id } })
          },
          comments(this: Authors) {
            return app.service('comments').useFind({ query: { authorId: this.id } })
          },
        })
        const withAssociationSetters = defineSetters(withAssociations, {
          posts(this: Posts, post: Posts) {
            author.setInstanceRan = true
            if (post.id && !this.authorIds.includes(post.id)) post.authorIds.push(post.id)
          },
        })
        return withAssociationSetters
      },
    },
    posts: {
      idField: 'id',
      setupInstance(post, { app }) {
        app.storeAssociated(post, {
          authors: 'authors',
          author: 'authors',
          comments: 'comments',
        })

        const withDefaults = useInstanceDefaults({ authorIds: [] }, post)
        // const withAssociations = defineGetters(withDefaults, {
        //   authors(this: Posts) {
        //     return app.service('authors').useFind({ query: { id: { $in: this.authorIds } } })
        //   },
        //   comments(this: Posts) {
        //     return app.service('comments').useFind({ query: { postId: this.id } })
        //   },
        // })
        return withDefaults
      },
    },
    comments: {
      idField: 'id',
      setupInstance(comment, { app }) {
        const withDefaults = useInstanceDefaults({ description: '', isComplete: false }, comment)
        const withAssociations = defineGetters(withDefaults, {
          post(this: Comments) {
            return app.service('posts').useGet(this.postId)
          },
          author(this: Comments) {
            return app.service('authors').useGet(this.authorId)
          },
        })
        return withAssociations
      },
    },
  },
})
