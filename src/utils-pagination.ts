import { computed, Ref } from 'vue-demi'

export const usePageData = ($limit: Ref<number>, $skip: Ref<number>, _total: Ref<number>) => {
  /**
   * The number of pages available based on the results returned in the latestQuery prop.
   */
  const pageCount = computed(() => {
    if (_total.value) return Math.ceil(_total.value / $limit.value)
    else return 1
  })

  // Uses Math.floor so we can't land on a non-integer page like 1.4
  const currentPage = computed({
    set(pageNumber: number) {
      if (pageNumber < 1) pageNumber = 1
      else if (pageNumber > pageCount.value) pageNumber = pageCount.value
      const newSkip = $limit.value * Math.floor(pageNumber - 1)
      $skip.value = newSkip
    },
    get() {
      return pageCount.value === 0 ? 0 : Math.floor($skip.value / $limit.value + 1)
    },
  })

  const canPrev = computed(() => {
    return currentPage.value - 1 > 0
  })
  const canNext = computed(() => {
    return currentPage.value < pageCount.value
  })

  const toStart = () => (currentPage.value = 1)
  const toEnd = () => (currentPage.value = pageCount.value)
  const toPage = (pageNumber: number) => (currentPage.value = pageNumber)
  const next = () => {
    currentPage.value++
  }
  const prev = () => currentPage.value--

  return { pageCount, currentPage, canPrev, canNext, toStart, toEnd, toPage, next, prev }
}
