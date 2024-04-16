import UFuzzy from '@leeoniya/ufuzzy'

interface uFuzzyParams extends UFuzzy.Options {
  /**
   * The search term.
   */
  search: string
  /**
   * The fields to search in.
   */
  fields: string[]
  /**
   * Whether sub-parts should be ranked out of order. Defaults to `0`, which is off.
   */
  outOfOrder?: 0 | 1
  /**
   * The maximum number of items to rank and sort. If more than this many items are found, the
   * results will be returned in the order they are found in the original list and no sorting will
   * be performed. Defaults to 1000.
   */
  sortMax?: number
  /**
   * When enabled, the ranges for each field will be included in the result items. Defaults to `true`.
   * This will modify the items in place by adding a property with the name specified in `rangesKey`.
   * The property is non-enumerable and will not be included in JSON.stringify. Once the search value
   * is empty, the ranges will be removed from each item.
   */
  includeRanges?: boolean
  /**
   * When `includeRanges` is enabled, this key will be used to store the ranges for each field. Defaults to `__ranges`.
   */
  rangesKey?: string
}

// See https://github.com/leeoniya/uFuzzy
const defaultUFuzzyOptions: UFuzzy.Options = {
  intraMode: 0,
  intraIns: 1,
  intraSub: 1,
  intraTrn: 1,
  intraDel: 1,
  intraChars: '[a-z\d\' ]',
  interChars: '.',
}

export function createUFuzzyFilter(ufOptions: UFuzzy.Options = {}) {
  return <M>(items: M[], params: uFuzzyParams, _query: Record<string, any>) => {
    if (params.search == null || !params.fields)
      throw new Error('Missing required parameters \'search\' or \'fields\' for $fuzzy operator.')

    if (params.fields.length === 0)
      throw new Error('The \'fields\' parameter must contain at least one key.')

    const rangesKey = params.rangesKey || '__ranges'

    // if no search term is provided, return all items
    if (params.search.length === 0) {
      // delete the __ranges property from each item
      for (const item of items)
        delete (item as any)[rangesKey]
      return items
    }

    const outOfOrder = params.outOfOrder || 0
    const sortMax = params.sortMax || 1e3
    const includeRanges = params.includeRanges || true

    const uf = new UFuzzy({
      ...defaultUFuzzyOptions,
      ...ufOptions,
    })

    // Concatenate the values of the specified fields into a search string
    const haystack = items.map((item) => {
      return params.fields.map((key) => {
        const value = (item as any)[key]
        return typeof value === 'string' ? value : typeof value === 'number' ? value.toString() : ''
      }).join(' ')
    })

    const needle = params.search

    const [idxs, info, order] = uf.search(haystack, needle, outOfOrder, sortMax)

    // If fewer than `sortMax` items were found, sort the results according to the ranking in `order`
    if (order && order.length) {
      const results = []

      for (let i = 0; i < order.length; i++) {
        const index = order[i]
        const item = items[idxs[index]]

        // If enabled, attach the rangesByField to each item
        if (includeRanges) {
          const rangesByField = calculateRanges(item, info.ranges[index], params.fields)
          Object.defineProperty(item, rangesKey, {
            value: rangesByField,
            enumerable: false,
            configurable: true,
          })
        }

        results.push(item)
      }

      return results
    }
    // If more than `sortMax` items were found, return the items in the order they were found
    else if (idxs && idxs.length) {
      return idxs.map(index => items[index])
    }
    // If no items were found, return an empty array
    else {
      return []
    }
  }
}

/**
 * Loop over each field to determine its specific ranges. Since uFuzzy only searches across individual fields,
 * and we're simulating a search across multiple fields by concatenating them, we need to calculate the ranges
 * for each field in the haystack. Also, since we're concatenating the fields with a space, this algorithm will
 * adjust the ranges to end between fields, as need to match the original data.
 */
function calculateRanges<M>(item: M, globalRanges: number[], fields: string[]) {
  const fieldRanges: Record<string, number[]> = fields.reduce((acc: Record<string, number[]>, field) => {
    acc[field] = []
    return acc
  }, {})

  let fieldStartIndex = 0

  // Initialize fieldRanges with empty arrays for each field
  for (const field of fields)
    fieldRanges[field] = []

  // Loop over each field to determine its specific ranges
  for (const field of fields) {
    const fieldValue = (item as any)[field] || ''
    const fieldLength = fieldValue.length
    const fieldEndIndex = fieldStartIndex + fieldLength

    // Loop over each global range
    for (let j = 0; j < globalRanges.length; j += 2) {
      const start = globalRanges[j]
      const end = globalRanges[j + 1]

      // If the range is within the current field's part of the haystack
      if (start < fieldEndIndex && end >= fieldStartIndex) {
        const relativeStart = Math.max(start - fieldStartIndex, 0)
        const relativeEnd = Math.min(end - fieldStartIndex, fieldLength)

        fieldRanges[field].push(relativeStart, relativeEnd)
      }
    }

    fieldStartIndex += fieldLength + 1 // Include the space that was added in the haystack
  }

  return fieldRanges
}
