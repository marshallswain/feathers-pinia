import { computed, watch, reactive, isRef, Ref } from 'vue-demi'

export function usePagination(pagination: any, latestQuery: Ref, options: any = {}) {
  /**
   * The number of pages available based on the results returned in the latestQuery prop.
   */
  const pageCount = computed(() => {
    const q = latestQuery.value
    if (q && q.response) {
      return Math.ceil(q.response.total / pagination.value.$limit)
    } else {
      return 1
    }
  })

  /**
   * The `currentPage` is calculated based on the $limit and $skip values
   */
  const currentPage = computed({
    set(pageNumber: number) {
      if (pageNumber < 1) {
        pageNumber = 1
      } else if (pageNumber > pageCount.value) {
        pageNumber = pageCount.value
      }
      const $limit = pagination.value.$limit
      const $skip = $limit * (pageNumber - 1)

      pagination.value = { $limit, $skip }
    },
    get() {
      const params = pagination.value
      if (params) {
        return pageCount.value === 0 ? 0 : params.$skip / params.$limit + 1
      } else {
        return 1
      }
    }
  })

  watch(
    () => pageCount.value,
    () => {
      const lq = latestQuery.value
      if (lq && lq.response && currentPage.value > pageCount.value) {
        currentPage.value = pageCount.value
      }
    }
  )

  const canPrev = computed(() => {
    return currentPage.value - 1 > 0
  })
  const canNext = computed(() => {
    return currentPage.value < pageCount.value
  })

  function toStart(): void {
    currentPage.value = 1
  }
  function toEnd(): void {
    currentPage.value = pageCount.value
  }
  function toPage(pageNumber: number): void {
    currentPage.value = pageNumber
  }

  function next(): void {
    currentPage.value++
  }
  function prev(): void {
    currentPage.value--
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
    prev
  }
}
