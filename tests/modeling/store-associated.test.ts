import { api } from '../fixtures/index.js'
import { resetService } from '../test-utils.js'

beforeEach(async () => {
  resetService(api.service('posts'))
  resetService(api.service('authors'))
  resetService(api.service('comments'))
})
afterEach(() => {
  resetService(api.service('contacts'))
})

describe('storeAssociated', () => {
  it('distributes data to the correct service stores', async () => {
    api.service('posts').new({
      title: 'foo',
      authors: [{ id: 1, name: 'Marshall' }],
      author: { id: 2, name: 'Myriah' },
      comments: [
        { id: 1, text: 'comment 1', authorId: 1, postId: 1 },
        { id: 2, text: 'comment 2', authorId: 1, postId: 1 },
      ],
    })

    const author1 = api.service('authors').getFromStore(1)
    const author2 = api.service('authors').getFromStore(2)
    const comments = api.service('comments').findInStore({ query: {} })

    expect(author1.value.name).toBe('Marshall')
    expect(author2.value.name).toBe('Myriah')
    expect(comments.data.length).toBe(2)
  })

  it('replaces values with non-enumerable values', async () => {
    const post = api.service('posts').new({
      title: 'foo',
      authors: [{ id: 1, name: 'Marshall' }],
      author: { id: 2, name: 'Myriah' },
      comments: [
        { id: 1, text: 'comment 1', authorId: 1, postId: 1 },
        { id: 2, text: 'comment 2', authorId: 1, postId: 1 },
      ],
    })

    expect(post.authors.length).toBe(1)
    expect(post.author.name).toBe('Myriah')
    expect(post.comments.length).toBe(2)

    const serialized = JSON.parse(JSON.stringify(post))

    expect(serialized.authors).toBeUndefined()
    expect(serialized.author).toBeUndefined()
    expect(serialized.comments).toBeUndefined()
  })

  it('related data is reactive', async () => {
    const post = api.service('posts').new({
      title: 'foo',
      authors: [{ id: 1, name: 'Marshall' }],
      author: { id: 2, name: 'Myriah' },
      comments: [
        { id: 1, text: 'comment 1', authorId: 1, postId: 1 },
        { id: 2, text: 'comment 2', authorId: 1, postId: 1 },
      ],
    })

    const author1 = api.service('authors').getFromStore(2)
    const result = api.service('authors').patchInStore(author1.value.id, { name: 'Austin' })

    expect(result.name).toBe('Austin')
    expect(post.author.name).toBe('Austin')
  })
})
