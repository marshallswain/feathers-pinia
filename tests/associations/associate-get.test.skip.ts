import type { Authors, AuthorsData, AuthorsQuery } from './feathers-schema-authors'
import type { Comments, CommentsData, CommentsQuery } from './feathers-schema-comments'
import {
  type ModelInstance,
  useFeathersModel,
  useInstanceDefaults,
  feathersPiniaHooks,
  // FeathersInstance,
  associateGet,
} from '../../src'
import { api } from '../feathers'
import { resetServiceStore } from '../test-utils'

const authorService = api.service('authors')
const commentService = api.service('comments')

/**
 * Author Model
 */
const modelFnAuthor = (data: ModelInstance<Authors>) => {
  const withDefaults = useInstanceDefaults({}, data)

  return withDefaults
}
const Author = useFeathersModel<Authors, AuthorsData, AuthorsQuery, typeof modelFnAuthor>(
  { name: 'Author', idField: 'id', service: authorService },
  modelFnAuthor,
)
authorService.hooks({ around: { all: [...feathersPiniaHooks(Author)] } })

/**
 * Comment Model - where each has an `authorId` and a `postId`
 */
const modelFnComment = (data: ModelInstance<Comments>) => {
  const withDefaults = useInstanceDefaults({ setInstanceRan: false }, data)
  const withAuthor = associateGet(withDefaults, 'author', {
    Model: Author,
    getId(data) {
      return data.authorId || data.__tempId
    },
    handleSetInstance(author) {
      this.setInstanceRan = true
      if (author.id || author.__tempId) {
        this.authorId = author.id || author.__tempId
      }
    },
  })
  return withAuthor
}
const Comment = useFeathersModel<Comments, CommentsData, CommentsQuery, typeof modelFnComment>(
  { name: 'Comment', idField: 'id', service: commentService },
  modelFnComment,
)
commentService.hooks({ around: { all: [...feathersPiniaHooks(Comment)] } })

// Reset service stores
const reset = () => {
  resetServiceStore(authorService)
  resetServiceStore(commentService)
}

beforeEach(() => {
  reset()
  Author.store.clearAll()
  Comment.store.clearAll()
  authorService.store = {
    1: { id: 1, name: 'Marshall' },
    2: { id: 2, name: 'David' },
    3: { id: 3, name: 'Beau' },
  }
  commentService.store = {
    1: { id: 1, text: 'Comment 1', authorId: 1, postId: 1 },
    2: { id: 2, text: 'Comment 2', authorId: 1, postId: 2 },
    3: { id: 3, text: 'Comment 3', authorId: 1, postId: 3 },
    4: { id: 4, text: 'Comment 4', authorId: 2, postId: 1 },
    5: { id: 5, text: 'Comment 5', authorId: 2, postId: 2 },
    6: { id: 6, text: 'Comment 6', authorId: 3, postId: 3 },
    7: { id: 7, text: 'Comment 7', authorId: 3, postId: 1 },
  }
})
afterAll(() => reset())

describe('Populated Data', () => {
  //
  test('values added by associatedGet default to null when no related data is present', async () => {
    const comment = Comment({}).addToStore()
    expect(comment.author).toBe(null)
  })

  test('a bogus id will still return null (no local data to populate)', async () => {
    const comment = Comment({ authorId: 1 }).addToStore()
    expect(comment.author).toBe(null)
  })

  test("pre-populated data gets added to the associated Model's store", async () => {
    const author = { id: 1, name: 'Marshall' }
    const comment = Comment({ authorId: 1, author }).addToStore()
    const populatedUser = JSON.parse(JSON.stringify(comment.author))
    expect(populatedUser).toEqual(author)
  })
})

describe('AssociateGet Utils', () => {
  test('utils are added at underscored prop, like `_author`', async () => {
    const comment = Comment({}).addToStore()
    expect(comment._author).toBeDefined()
  })

  test('utils include a `get` method', () => {
    const comment = Comment({}).addToStore()
    expect(typeof comment._author.get).toBe('function')
  })

  test('utils include a `getFromStore` method', () => {
    const comment = Comment({}).addToStore()
    expect(typeof comment._author.getFromStore).toBe('function')
  })
})

describe('Fetching Associated Data', () => {
  test('can get associated data directly from the instance', async () => {
    const comment = Comment({ authorId: 3 }).addToStore()
    const result = await comment._author.get(3)
    expect(result?.id).toBe(3)
  })

  test('throws 404 if not found', async () => {
    const comment = Comment({}).addToStore()
    try {
      await comment._author.get(4)
    } catch (error: any) {
      expect(error.code).toBe(404)
    }
  })
})

describe('Writing to the Association Attribute', () => {
  test('writing a record to the association triggers the handleSetInstance callback', async () => {
    const author = { id: 1, name: 'Marshall' }
    const comment = Comment({}).addToStore()
    comment.author = author
    expect(comment.setInstanceRan).toBeTruthy()
    expect(comment.authorId).toBe(1)
  })

  test('after passing through handleSetInstance, the data can be retrieved from the store.', async () => {
    const author = { id: 1, name: 'Marshall' }
    const comment = Comment({}).addToStore()
    comment.author = author
    expect(comment.author).toEqual(author)
  })

  test('associations also work for temp records', async () => {
    const author = { name: 'Marshall' }
    const comment = Comment({}).addToStore()
    // Write data without an id to the `author` setter
    comment.author = author
    expect(comment.author.__tempId).toBe(comment.authorId)
    expect(typeof comment.author.__tempId).toBe('string')
  })
})

describe('Saving Instance', () => {
  test('assocations are not included during save', async () => {
    let hadAssociatedData = false
    const comment = Comment({ authorId: 3 }).addToStore()
    // Populate the author and make sure it shows up through the getter.
    await comment._author.get(3)
    expect(comment.author.id).toBe(3)
    // Use a hook to make sure `author` isn't sent to the API server.
    const hook = (context) => {
      if (context.data.author) {
        hadAssociatedData = true
      }
      return context
    }
    commentService.hooks({ before: { create: [hook] } })
    expect(hadAssociatedData).toBeFalsy()
  })

  test('assocated data must be manually saved', async () => {
    const comment = Comment({ authorId: 3 }).addToStore()
    await comment._author.get(3)
    const result = await comment.author?.save()
    expect(result.id).toBe(3)
  })
})

describe('Cloning Associations', () => {
  test('associated data is still present after clone', async () => {
    const comment = Comment({ authorId: 3 }).addToStore()
    await comment._author.get(3)
    const clone = comment.clone()
    expect(comment.author).toEqual(clone.author)
  })

  test('associated data is still present after clone/commit', async () => {
    const comment = Comment({ authorId: 3 }).addToStore()
    await comment._author.get(3)
    const clone = comment.clone()
    const original = clone.commit()
    expect(original.author).toEqual(clone.author)
  })

  test('associated data is still present after clone/re-clone/reset', async () => {
    const comment = Comment({ authorId: 3 }).addToStore()
    await comment._author.get(3)

    const clone = comment.clone()

    const clone2 = clone.clone()
    expect(clone2).toEqual(clone)
    expect(clone2.author).toEqual(clone.author)

    const clone3 = clone.clone()
    expect(clone3).toEqual(clone)
    expect(clone3.author).toEqual(clone.author)
  })
})

// describe('Paginating Assocations', () => {})
