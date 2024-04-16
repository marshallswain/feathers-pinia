import type { Application, FeathersService, HookContext, Params } from '@feathersjs/feathers'
import { feathers } from '@feathersjs/feathers'
import { MemoryService, memory } from '@feathersjs/memory'
import { NotAuthenticated } from '@feathersjs/errors'
import { createPinia } from 'pinia'
import rest from '@feathersjs/rest-client'
import axios from 'axios'
import auth from '@feathersjs/authentication-client'
import { computed, ref } from 'vue'
import { vi } from 'vitest'
import type { AdapterParams } from '@feathersjs/adapter-commons'
import { createPiniaClient, defineGetters, defineSetters, useInstanceDefaults } from '../../src'
import { createUFuzzyFilter } from '../../src/ufuzzy'
import { timeout } from '../test-utils.js'
import { makeContactsData } from './data.js'
import type { Comments } from './schemas/comments'
import type { Authors } from './schemas/authors'
import type { Posts } from './schemas/posts'
import type { Contacts, ContactsData, ContactsQuery } from './schemas/contacts'
import type { Users, UsersData } from './schemas/users'
import type { Tasks, TasksData, TasksQuery } from './schemas/tasks'

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
  async customCreate(data: UsersData, params?: AdapterParams) {
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
const BookService = memory({ paginate: paginate(), whitelist: whitelist() })
const PageService = memory({ paginate: paginate(), whitelist: whitelist() })

export interface ServiceTypes {
  users: typeof UserService
  tasks: typeof TaskService
  contacts: typeof ContactService
  authors: typeof AuthorService
  posts: typeof PostService
  comments: typeof CommentService
  books: typeof BookService
  pages: typeof PageService
}

/**
 * Registers services on the provided feathersClient instance.
 */
function createFeathers<F extends Application>(feathers: F) {
  const feathersClient = feathers
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
    .use('books', BookService)
    .use('pages', PageService)

  // hooks to simulate auth responses
  feathersClient.authentication.service.hooks({
    before: {
      create: [
        async (context: HookContext) => {
          const { data } = context
          if (data.accessToken === 'invalid') {
            throw new NotAuthenticated('invalid token')
          }
          else if (data.strategy === 'jwt') {
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

  return feathersClient
}

/** Wraps a feathersClient instance in a PiniaClient */
function wrapPiniaClient<F extends Application>(feathersClient: F) {
  return createPiniaClient(feathersClient, {
    pinia,
    idField: '_id',
    whitelist: ['$regex'],
    syncWithStorage: false,
    storage: localStorageMock,
    paramsForServer: [],
    customFilters: [
      { key: '$fuzzy', operator: createUFuzzyFilter() },
    ],
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
              if (post.id && !this.authorIds.includes(post.id))
                post.authorIds.push(post.id)
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
      books: {
        idField: 'id',
        setupInstance(book, { app }) {
          app.pushToStore(book.pages, 'pages')
          app.defineVirtualProperty(book, 'pages', (book: any) => {
            return app.service('pages').findInStore({ query: { bookId: book.id } }).data
          })
          return book
        },
      },
      pages: {
        idField: 'id',
      },
    },
  })
}

/**
 * Plain Feathers clients. One is typed, the other is not.
 */
const feathersClient = createFeathers(feathers<ServiceTypes>())
const feathersClientUntyped = createFeathers(feathers<Record<string, FeathersService>>())

/**
 * Wraps each feathersClient in a PiniaClient and exports.
 */
export const api = wrapPiniaClient(feathersClient)
export const apiUntyped = wrapPiniaClient(feathersClientUntyped)
