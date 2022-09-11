import type { MaybeRef } from './utility-types'
import { computed, watch, Ref, unref } from 'vue-demi'
import { usePageData } from './utils-pagination'

interface Pagination {
  $limit: number
  $skip: number
}

export function usePagination(pagination: MaybeRef<Pagination>, latestQuery: Ref) {
  const set = (pagination: any, key: string, val: number) => {
    (pagination.value || pagination)[key] = val
  }
  const $limit = computed({
    set: (val) => set(pagination, '$limit', val),
    get: () => unref(pagination).$limit,
  })
  const $skip = computed({
    set: (val) => set(pagination, '$skip', val),
    get: () => unref(pagination).$skip,
  })
  const total = computed(() => latestQuery.value.response.total)
  const { pageCount, currentPage, canPrev, canNext, toStart, toEnd, toPage, next, prev } = usePageData(
    $limit,
    $skip,
    total,
  )

  /**
   * The number of items returned in the latestQuery prop.
   */
  const itemsCount = computed(() => {
    const q = unref(latestQuery)
    if (q && q.response) {
      return q.response.total
    } else {
      return 0
    }
  })

  // If the max page becomes lower, go to the last page to still show data
  watch(
    () => pageCount.value,
    () => {
      const lq = latestQuery.value
      if (lq && lq.response && currentPage.value > pageCount.value) {
        currentPage.value = pageCount.value
      }
    },
  )

  return {
    itemsCount,
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
