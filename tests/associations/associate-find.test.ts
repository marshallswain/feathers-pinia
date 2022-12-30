import type { Authors, AuthorsData, AuthorsQuery } from './feathers-schema-authors'
import type { Posts, PostsData, PostsQuery } from './feathers-schema-posts'
import type { Comments, CommentsData, CommentsQuery } from './feathers-schema-comments'
import {
  type ModelInstance,
  useFeathersModel,
  useInstanceDefaults,
  feathersPiniaHooks,
  associateFind,
  FeathersInstance,
} from '../../src'
import { api } from '../feathers'
import { resetServiceStore } from '../test-utils'

const authorService = api.service('authors')
const postService = api.service('posts')
const commentService = api.service('comments')

/**
 * Author Model
 */
const ModelFnAuthor = (data: ModelInstance<Authors>) => {
  const withDefaults = useInstanceDefaults({ setInstanceRan: false }, data)
  const withPosts = associateFind(withDefaults, 'posts', {
    Model: Post,
    makeParams: (data) => ({ query: { authorIds: data.id } }),
    handleSetInstance(post: Posts) {
      this.setInstanceRan = true
      if (data.id && !post.authorIds.includes(data.id)) {
        post.authorIds.push(data.id)
      }
    },
  })
  return withPosts
}
const Author = useFeathersModel<Authors, AuthorsData, AuthorsQuery, typeof ModelFnAuthor>(
  { name: 'Author', idField: 'id', service: authorService },
  ModelFnAuthor,
)
authorService.hooks({ around: { all: [...feathersPiniaHooks(Author)] } })

/**
 * Post Model - where each has `authorIds`
 */
const ModelFnPost = (data: ModelInstance<Posts>) => {
  const withDefaults = useInstanceDefaults({ authorIds: [] }, data)
  const withAuthors = associateFind(withDefaults, 'authors', {
    Model: Author,
    makeParams: (data) => ({ query: { id: { $in: data.authorIds } } }),
  })
  return withAuthors
}
const Post = useFeathersModel<Posts, PostsData, PostsQuery, typeof ModelFnPost>(
  { name: 'Post', idField: 'id', service: postService },
  ModelFnPost,
)
postService.hooks({ around: { all: [...feathersPiniaHooks(Post)] } })

/**
 * Comment Model - where each has an `authorId` and a `postId`
 */
const ModelFnComment = (data: ModelInstance<Comments>) => {
  const withDefaults = useInstanceDefaults({ description: '', isComplete: false }, data)
  return withDefaults
}
const Comment = useFeathersModel<Comments, CommentsData, CommentsQuery, typeof ModelFnComment>(
  { name: 'Comment', idField: 'id', service: commentService },
  ModelFnComment,
)
commentService.hooks({ around: { all: [...feathersPiniaHooks(Comment)] } })

// Reset service stores
const reset = () => {
  resetServiceStore(authorService)
  resetServiceStore(postService)
  resetServiceStore(commentService)
}

beforeEach(() => {
  reset()
  Author.store.clearAll()
  Post.store.clearAll()
  Comment.store.clearAll()
  authorService.store = {
    1: { id: 1, name: 'Marshall' },
    2: { id: 2, name: 'David' },
    3: { id: 3, name: 'Beau' },
  }
  postService.store = {
    1: { id: 1, title: 'Post 1', authorIds: [1] },
    2: { id: 2, title: 'Post 2', authorIds: [1, 2] },
    3: { id: 3, title: 'Post 3', authorIds: [1, 2, 3] },
    4: { id: 4, title: 'Post 4', authorIds: [2] },
    5: { id: 5, title: 'Post 5', authorIds: [2, 3] },
    6: { id: 6, title: 'Post 6', authorIds: [3] },
    7: { id: 7, title: 'Post 7', authorIds: [3] },
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
  test('values added by associatedFind default to an empty array when no related data is present', async () => {
    const author = Author({}).addToStore()
    expect(author.posts).toEqual([])
  })

  test('bogus ids will still return an empty array (no local data to populate)', async () => {
    const author = Author({}).addToStore()
    expect(author.posts).toEqual([])
  })

  test("pre-populated data gets added to the foreign Model's store", async () => {
    const posts = await postService.find({ query: { authorIds: 1 }, paginate: false, skipStore: true })

    // records are not in store after a query that uses skipStore
    expect(Post.findInStore({ query: {} }).data.length).toBe(0)

    const author = Author({ id: 1, name: 'Marshall', posts }).addToStore()
    expect(author.posts).toEqual(posts)
    // make sure the records were added to the Post store
    expect(Post.findInStore({ query: {} }).data.length).toBe(3)
  })
})

describe('AssociateFind Utils', () => {
  test('utils are added at underscored prop, like `_posts`', async () => {
    const author = Author({}).addToStore()
    expect(author._posts).toBeDefined()
    expect(author._posts.allData.length).toBe(0)
  })

  test('utils include a `find` method', () => {
    const author = Author({}).addToStore()
    expect(typeof author._posts.find).toBe('function')
  })

  test('utils include a `findInStore` method', () => {
    const author = Author({}).addToStore()
    expect(typeof author._posts.findInStore).toBe('function')
  })

  test('utils include a `useFind` method', () => {
    const author = Author({}).addToStore()
    expect(typeof author._posts.useFind).toBe('function')
  })

  test('can use nested `useFind` to make a new query', () => {
    const author = Author({}).addToStore()
    const { data, prev, next } = author._posts.useFind({ query: {} })
    expect(Array.isArray(data.value)).toBe(true)
    expect(typeof next).toBe('function')
    expect(typeof prev).toBe('function')
  })
})

describe('Fetching Associated Data - "posts belong to many authors"', () => {
  test('can find associated data directly from the instance', async () => {
    const post = Post({ authorIds: [1, 2, 3] }).addToStore()
    const result = await post._authors.find()
    const authors = result.data as FeathersInstance<Authors>[]
    expect(authors.length).toBe(3)
    expect(authors.map((i) => i.id)).toEqual([1, 2, 3])
  })

  test('returns empty results if there is no data matching the params given to `associateFind`', async () => {
    const message = Author({}).addToStore()
    const result = await message._posts.find()
    expect(result.data.length).toEqual(0)
    expect(result.data.map((i: any) => i.id)).toEqual([])
  })
})

describe('Writing to the Association Attribute', () => {
  test('writing records to the association triggers the handleSetInstance callback', async () => {
    const posts = [{ id: 1, name: 'Marshall' }]
    const author = Author({}).addToStore()
    author.posts = posts
    expect(author.setInstanceRan).toBeTruthy()
  })

  test('after passing through handleSetInstance, the data can be retrieved from the store.', async () => {
    const posts = await postService.find({ query: { authorIds: 1 }, paginate: false, skipStore: true })
    const author = Author({ id: 1 }).addToStore()
    author.posts = posts
    // expect(author.posts).toEqual([1, 2, 3])
    expect(author.posts.length).toBe(3)
    expect(author.posts).toEqual(posts)
  })

  test('associations are maintained for records without ids when the query in makeParams includes __tempId', async () => {
    const author = Author({ id: 1 }).addToStore()

    // Write data without an id to the `posts` setter
    author.posts = [{ title: 'Rocketman', userIds: [] }]
    const post = author.posts[0]
    expect(post.__tempId).toBeTruthy()
  })
})

describe('Saving Instance', () => {
  test('assocations are not included during save', async () => {
    let hadAssociatedData = false
    let hookRan = false
    const author = Author({ id: 1 }).addToStore()

    // Populate the posts and make sure they show up through the getter.
    await author._posts.find()
    expect(author.posts.length).toBe(3)

    // Use a hook to make sure `posts` isn't sent to the API server.
    const hook = (context) => {
      hookRan = true
      if (context.data.posts) {
        hadAssociatedData = true
      }
      return context
    }
    authorService.hooks({ before: { all: [hook] } })

    await author.save()

    expect(hookRan).toBeTruthy()
    expect(hadAssociatedData).toBeFalsy()
  })

  test('assocated data must be manually saved', async () => {
    const message = Author({ id: 1 }).addToStore()
    await message._posts.find()
    const results = await Promise.all(message.posts.map((post) => post.save()))
    expect(results?.length).toBe(3)
  })
})

describe('Cloning Associations', () => {
  test('associated data is still present after clone', async () => {
    const author = Author({ id: 1 }).addToStore()
    await author._posts.find()
    const clone = author.clone()
    expect(author.posts?.length).toEqual(3)
    expect(clone.posts?.length).toEqual(3)
  })

  test('associated data is still present after clone/commit', async () => {
    const author = Author({ id: 1 }).addToStore()
    await author._posts.find()
    const clone = author.clone()
    const original = clone.commit()
    expect(clone.posts?.length).toEqual(3)
    expect(original.posts?.length).toEqual(3)
  })

  test('associated data is still present after clone/re-clone/reset', async () => {
    const author = Author({ id: 1 }).addToStore()
    await author._posts.find()
    const clone = author.clone()

    const clone2 = clone.clone()
    expect(clone2).toEqual(clone)
    expect(clone2.posts?.length).toEqual(3)

    const clone3 = clone.clone()
    expect(clone3).toEqual(clone)
    expect(clone3.posts?.length).toEqual(3)
  })
})

// describe('Paginating Assocations', () => {})
