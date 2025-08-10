import { ref } from 'vue-demi'
import { usePageData } from '../../src/use-find-get/utils-pagination'

describe('usePageData', () => {
  it('calculates pageCount and currentPage', async () => {
    const limit = ref(10)
    const skip = ref(0)
    const total = ref(25)
    const pageData = usePageData({ limit, skip, total })

    expect(pageData.currentPage.value).toBe(1)
    expect(pageData.pageCount.value).toBe(3)
  })

  it('calculates pageCount and currentPage when skip is in the middle of a page', async () => {
    const limit = ref(10)
    const skip = ref(4)
    const total = ref(25)
    const pageData = usePageData({ limit, skip, total })

    expect(pageData.currentPage.value).toBe(1)
    expect(pageData.pageCount.value).toBe(3)
  })

  it('canPrev is false when on first page', async () => {
    const limit = ref(10)
    const skip = ref(0)
    const total = ref(25)
    const pageData = usePageData({ limit, skip, total })

    expect(pageData.canPrev.value).toBe(false)
  })

  it('canPrev is true when NOT on first page', async () => {
    const limit = ref(10)
    const skip = ref(10)
    const total = ref(25)
    const pageData = usePageData({ limit, skip, total })

    expect(pageData.canPrev.value).toBe(true)
  })

  it('canNext is false when on last page', async () => {
    const limit = ref(10)
    const skip = ref(20)
    const total = ref(25)
    const pageData = usePageData({ limit, skip, total })

    expect(pageData.canNext.value).toBe(false)
  })

  it('canNext is true when NOT on last page', async () => {
    const limit = ref(10)
    const skip = ref(0)
    const total = ref(25)
    const pageData = usePageData({ limit, skip, total })

    expect(pageData.canNext.value).toBe(true)
  })

  it('calling next moves to the next page', async () => {
    const limit = ref(10)
    const skip = ref(0)
    const total = ref(25)
    const pageData = usePageData({ limit, skip, total })

    pageData.next()

    expect(pageData.currentPage.value).toBe(2)
  })

  it('calling prev moves to the previous page', async () => {
    const limit = ref(10)
    const skip = ref(20)
    const total = ref(25)
    const pageData = usePageData({ limit, skip, total })

    pageData.prev()

    expect(pageData.currentPage.value).toBe(2)
  })

  it('calling toStart moves to the first page', async () => {
    const limit = ref(10)
    const skip = ref(20)
    const total = ref(25)
    const pageData = usePageData({ limit, skip, total })

    pageData.toStart()

    expect(pageData.currentPage.value).toBe(1)
  })

  it('calling toEnd moves to the last page', async () => {
    const limit = ref(10)
    const skip = ref(0)
    const total = ref(25)
    const pageData = usePageData({ limit, skip, total })

    pageData.toEnd()

    expect(pageData.currentPage.value).toBe(3)
  })

  it('calling toPage moves to that page', async () => {
    const limit = ref(10)
    const skip = ref(0)
    const total = ref(25)
    const pageData = usePageData({ limit, skip, total })

    pageData.toPage(3)

    expect(pageData.currentPage.value).toBe(3)
  })

  it('setting currentPage moves to that page', async () => {
    const limit = ref(10)
    const skip = ref(0)
    const total = ref(25)
    const pageData = usePageData({ limit, skip, total })

    pageData.currentPage.value = 3

    expect(pageData.currentPage.value).toBe(3)
  })

  it('setting currentPage to a float moves to the correct page', async () => {
    const limit = ref(10)
    const skip = ref(0)
    const total = ref(25)
    const pageData = usePageData({ limit, skip, total })

    pageData.toPage(3.5)

    expect(pageData.currentPage.value).toBe(3)
  })

  it('setting above pageCount goes to the last page', async () => {
    const limit = ref(10)
    const skip = ref(0)
    const total = ref(25)
    const pageData = usePageData({ limit, skip, total })

    pageData.toPage(5.5)

    expect(pageData.currentPage.value).toBe(3)
  })

  it('setting below page 1 goes to the first page', async () => {
    const limit = ref(10)
    const skip = ref(0)
    const total = ref(25)
    const pageData = usePageData({ limit, skip, total })

    pageData.toPage(0)

    expect(pageData.currentPage.value).toBe(1)
  })
})
