import { computed } from 'vue'
import { api } from '../fixtures/index.js'
import { resetService } from '../test-utils.js'
import { useBackup } from '../../src/index.js'

beforeEach(async () => {
  resetService(api.service('posts'))
  resetService(api.service('authors'))
  resetService(api.service('comments'))
})
afterEach(() => {
  resetService(api.service('contacts'))
})

describe('useBackup', () => {
  it('returns the original object in data.value', async () => {
    const props = {
      book: api.service('books').createInStore({
        id: 1,
        title: 'Book 1',
      }),
    }

    const bookBackup = useBackup(computed(() => props.book))
    const { data: book } = bookBackup

    expect(book.value).toStrictEqual(props.book)

    expect(typeof bookBackup.save).toBe('function')
    expect(typeof bookBackup.restore).toBe('function')
  })

  it('can restore original values', async () => {
    const props = {
      book: api.service('books').createInStore({
        id: 1,
        title: 'Book 1',
      }),
    }

    const bookBackup = useBackup(computed(() => props.book))
    const { data: book } = bookBackup

    expect(book.value.title).toBe('Book 1')

    book.value.title = 'New Title'

    expect(book.value.title).toBe('New Title')

    bookBackup.restore(book)

    expect(book.value.title).toBe('Book 1')
  })

  it('can save', async () => {
    const storedBook = await api.service('books').create({ title: 'Book 1' })
    const props = { book: storedBook }

    const bookBackup = useBackup(computed(() => props.book))
    const { data: book } = bookBackup

    book.value.title = 'Book 1 Revised Edition'

    await bookBackup.save()

    expect(book.value.title).toBe('Book 1 Revised Edition')
  })
})
