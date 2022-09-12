import { ref } from 'vue-demi'
import { usePageData } from '../src/utils-pagination'

describe('usePageData', () => {
  test('calculates pageCount and currentPage', async () => {
    const $limit = ref(10)
    const $skip = ref(0)
    const _total = ref(25)
    const pageData = usePageData($limit, $skip, _total)

    expect(pageData.currentPage.value).toBe(1)
    expect(pageData.pageCount.value).toBe(3)
  })

  test('calculates pageCount and currentPage when $skip is in the middle of a page', async () => {
    const $limit = ref(10)
    const $skip = ref(4)
    const _total = ref(25)
    const pageData = usePageData($limit, $skip, _total)

    expect(pageData.currentPage.value).toBe(1)
    expect(pageData.pageCount.value).toBe(3)
  })

  test('canPrev is false when on first page', async () => {
    const $limit = ref(10)
    const $skip = ref(0)
    const _total = ref(25)
    const pageData = usePageData($limit, $skip, _total)

    expect(pageData.canPrev.value).toBe(false)
  })

  test('canPrev is true when NOT on first page', async () => {
    const $limit = ref(10)
    const $skip = ref(10)
    const _total = ref(25)
    const pageData = usePageData($limit, $skip, _total)

    expect(pageData.canPrev.value).toBe(true)
  })

  test('canNext is false when on last page', async () => {
    const $limit = ref(10)
    const $skip = ref(20)
    const _total = ref(25)
    const pageData = usePageData($limit, $skip, _total)

    expect(pageData.canNext.value).toBe(false)
  })

  test('canNext is true when NOT on last page', async () => {
    const $limit = ref(10)
    const $skip = ref(0)
    const _total = ref(25)
    const pageData = usePageData($limit, $skip, _total)

    expect(pageData.canNext.value).toBe(true)
  })

  test('calling next moves to the next page', async () => {
    const $limit = ref(10)
    const $skip = ref(0)
    const _total = ref(25)
    const pageData = usePageData($limit, $skip, _total)

    pageData.next()

    expect(pageData.currentPage.value).toBe(2)
  })

  test('calling prev moves to the previous page', async () => {
    const $limit = ref(10)
    const $skip = ref(20)
    const _total = ref(25)
    const pageData = usePageData($limit, $skip, _total)

    pageData.prev()

    expect(pageData.currentPage.value).toBe(2)
  })

  test('calling toStart moves to the first page', async () => {
    const $limit = ref(10)
    const $skip = ref(20)
    const _total = ref(25)
    const pageData = usePageData($limit, $skip, _total)

    pageData.toStart()

    expect(pageData.currentPage.value).toBe(1)
  })

  test('calling toEnd moves to the last page', async () => {
    const $limit = ref(10)
    const $skip = ref(0)
    const _total = ref(25)
    const pageData = usePageData($limit, $skip, _total)

    pageData.toEnd()

    expect(pageData.currentPage.value).toBe(3)
  })

  test('calling toPage moves to that page', async () => {
    const $limit = ref(10)
    const $skip = ref(0)
    const _total = ref(25)
    const pageData = usePageData($limit, $skip, _total)

    pageData.toPage(3)

    expect(pageData.currentPage.value).toBe(3)
  })

  test('setting currentPage moves to that page', async () => {
    const $limit = ref(10)
    const $skip = ref(0)
    const _total = ref(25)
    const pageData = usePageData($limit, $skip, _total)

    pageData.currentPage.value = 3

    expect(pageData.currentPage.value).toBe(3)
  })

  test('setting currentPage to a float moves to the correct page', async () => {
    const $limit = ref(10)
    const $skip = ref(0)
    const _total = ref(25)
    const pageData = usePageData($limit, $skip, _total)

    pageData.toPage(3.5)

    expect(pageData.currentPage.value).toBe(3)
  })

  test('setting above pageCount goes to the last page', async () => {
    const $limit = ref(10)
    const $skip = ref(0)
    const _total = ref(25)
    const pageData = usePageData($limit, $skip, _total)

    pageData.toPage(5.5)

    expect(pageData.currentPage.value).toBe(3)
  })

  test('setting below page 1 goes to the first page', async () => {
    const $limit = ref(10)
    const $skip = ref(0)
    const _total = ref(25)
    const pageData = usePageData($limit, $skip, _total)

    pageData.toPage(0)

    expect(pageData.currentPage.value).toBe(1)
  })
})
