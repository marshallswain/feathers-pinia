import type { Ref } from 'vue-demi'
import { computed } from 'vue-demi'
import { timeout } from '../utils/index.js'

interface Options {
  limit: Ref<number>
  skip: Ref<number>
  total: Ref<number>
  request?: any
}

export function usePageData(options: Options) {
  const { limit, skip, total, request } = options
  /**
   * The number of pages available based on the results returned in the latestQuery prop.
   */
  const pageCount = computed(() => {
    if (total.value)
      return Math.ceil(total.value / limit.value)
    else return 1
  })

  // Uses Math.floor so we can't land on a non-integer page like 1.4
  const currentPage = computed({
    set(pageNumber: number) {
      if (pageNumber < 1)
        pageNumber = 1
      else if (pageNumber > pageCount.value)
        pageNumber = pageCount.value
      const newSkip = limit.value * Math.floor(pageNumber - 1)
      skip.value = newSkip
    },
    get() {
      const skipVal = skip.value || 0
      return pageCount.value === 0 ? 0 : Math.floor(skipVal / limit.value + 1)
    },
  })

  const canPrev = computed(() => {
    return currentPage.value - 1 > 0
  })
  const canNext = computed(() => {
    return currentPage.value < pageCount.value
  })

  const wait = async () => {
    if (request?.value)
      await request.value
  }
  const toStart = async () => {
    currentPage.value = 1
    await timeout(0)
    return wait()
  }
  const toEnd = async () => {
    currentPage.value = pageCount.value
    await timeout(0)
    return wait()
  }
  const toPage = async (page: number) => {
    currentPage.value = page
    await timeout(0)
    return wait()
  }
  const next = async () => {
    currentPage.value++
    await timeout(0)
    return wait()
  }
  const prev = async () => {
    currentPage.value--
    await timeout(0)
    return wait()
  }

  return {
    pageCount,
    currentPage,
    canPrev,
    canNext,
    toStart,
    toEnd,
    toPage,
    next,
    prev,
  }
}
