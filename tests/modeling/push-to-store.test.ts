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

describe('pushToStore', () => {
  it('distributes data to the correct service stores', async () => {
    api.service('books').createInStore({
      id: 1,
      title: 'Book 1',
      pages: [
        { id: 1, title: 'Page 1', bookId: 1 },
        { id: 2, title: 'Page 2', bookId: 1 },
      ],
    })

    const page1 = api.service('pages').getFromStore(1)
    const page2 = api.service('pages').getFromStore(2)

    expect(page1.value.title).toBe('Page 1')
    expect(page2.value.title).toBe('Page 2')
  })

  it('replaces values with non-enumerable values', async () => {
    const book = api.service('books').createInStore({
      id: 2,
      title: 'Book 2',
      pages: [
        { id: 3, title: 'Page 3', bookId: 2 },
        { id: 4, title: 'Page 4', bookId: 2 },
      ],
    })

    expect(book.pages.length).toBe(2)

    const serialized = JSON.parse(JSON.stringify(book))

    expect(serialized.pages).toBeUndefined()
  })

  it('related data is reactive', async () => {
    const book = api.service('books').createInStore({
      id: 3,
      title: 'Book 2',
      pages: [
        { id: 5, title: 'Page 5', bookId: 3 },
        { id: 6, title: 'Page 6', bookId: 3 },
      ],
    })

    expect(book.pages.length).toBe(2)

    const page = api.service('pages').createInStore({
      id: 7,
      title: 'Page 7',
      bookId: 3,
    })

    expect(book.pages.length).toBe(3)
    expect(book.pages[2].title).toBe(page.title)
  })
})
