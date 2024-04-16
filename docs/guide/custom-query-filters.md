---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Custom Query Filters

The [createPiniaClient](./create-pinia-client#createpiniaclient) function accepts a new `customFilters` option. Custom Filters let you define query superpowers for local queries using the `findInStore` method.

[[toc]]

## Why Use Custom Filters

Custom filters provide the following benefits:

- Custom filters let you attach functionality to your own, custom query parameters.
- Custom filters run **before** the rest of the query operators, giving you access to the full list of stored items for a service.
- Custom filters are easier to define than `customSiftOperators` because they need no prior knowledge of custom interfaces. 

Note: You cannot override built-in query operators like `$limit`, `$skip`, `$sort`, or `$select` with custom filters.

## The uFuzzy Custom Filter

Feathers-Pinia 4.5+ ships with a built-in custom filter called `uFuzzy`. The `uFuzzy` filter lets you perform fuzzy searches on your local data. In order to use it, you need to install the [@leeoniya/ufuzzy](https://github.com/leeoniya/uFuzzy) package into your project:

```bash
pnpm install @leeoniya/ufuzzy
```

You can now import and use the `createUFuzzyFilter` function to create a custom filter. To keep the feathers-pinia package size smaller, the ufuzzy operator is not provided in the main exports and must be imported from `feathers-pinia/ufuzzy`. In this next example, we create a custom filter called `$fuzzy` that uses the `uFuzzy` operator:

```ts
import { createUFuzzyFilter } from 'feathers-pinia/ufuzzy'

const api = createPiniaClient(feathersClient, {
  pinia,
  idField: 'id',
  customFilters: [
    { key: '$fuzzy', operator: createCursorPaginationFilter() },
  ],
})
```

You can rename `$fuzzy` to whatever you would like. It will only affect queries that use `findInStore`, including `useFind` when set to `paginateOn: 'client'`.

Now let's use the `$fuzzy` operator to search for messages that contain the phrase "hello world":

```ts
const { data } = await api.service('messages').findInStore({
  query: {
    $fuzzy: {
      search: 'hello world',
      fields: ['text']
    }
  }
})
```

The `fields` property is an array of fields to search for the `search` term. The `search` term is the string to search for in the specified fields. The `uFuzzy` filter will return all items that fuzzy match the search term in any of the specified fields.

So we can also search across multiple fields. Let's search for users by first name, last name, or email:

```ts
const { data } = await api.service('users').findInStore({
  query: {
    $fuzzy: {
      search: 'john',
      fields: ['firstName', 'lastName', 'email']
    }
  }
})
```

### Matched __ranges

Search results will have a non-enumerable property added to them called `__ranges`. This property contains the ranges of the matched characters in the search term. This can be useful for highlighting search results in the UI.  The `__ranges` property is not enumerable, so it won't show up in JSON.stringify or Vue Devtools. It's an object keyed by field name, so it might have the following structure for the last example:

```ts
const johnDoe = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'johndoe@gmail.com',
  __ranges: {
    "firstName": [0, 3],
    "lastName": [],
    "email": [],
  }
}
```

Note that only the first 3 characters of the first name matched the search term, even though email also contained a match. This is because the `firstName` field was listed first in the `fields` array. Once a match is found in a field, the search stops and the result is returned. This keeps things fast.

Once you clear the search term, the `__ranges` property will be removed from the result.

### Why not Fuse.js?

Here are observations while working with [Fuse.js](https://www.fusejs.io/) and [uFuzzy](https://github.com/leeoniya/uFuzzy):

1. uFuzzy is **much** faster.  We're talking 100x to 1000x faster than Fuse.js. See the benchmarks and compare for yourself. Since we're already working with Vue's reactivity system, there's some overhead involved. The fuzzy search implementation needs to be fast to keep the UI responsive.
2. Fuse.js is more configurable, which looks great on the surface. In practice, it's only configurable because it doesn't return a great set of results by default.  So you need to configure it for every new dataset in order to get good results. The algorithm in uFuzzy tends to return great results using the same configuration across datasets. uFuzzy is also lightly configurable.
3. uFuzzy returns higher quality results. For example, it prioritizes exact matches before fuzzy matches. This tends to turn up relevant results faster.
4. Fuse.js is much easier to setup. uFuzzy requires a bit more work to get started.  It's more of a low-level API.
5. Fuse.js supports searching across multiple fields by default. With uFuzzy this requires some extra work. The implementation in feathers-pinia supports searching across multiple fields, making it just as easy to use as Fuse.js.

## Create Your Own Custom Filter

Suppose we have a project that needs to use cursor-based pagination instead of `$skip`-based pagination. Since we can't override `$skip`, we can create a custom filter called `$paginate` that uses an `after` parameter to fetch the next set of items after a specific id. The example might be a bit contrived, but it demonstrates how to create a custom filter.

```ts
// src/filter.cursor-pagination.ts

// define the shape of your custom operator's options
export interface PaginateAfterOptions {
  defaultLimit?: number
  idField?: string
}

// define the shape of the query params specific to your custom operator
export type PaginateAfterQueryParams {
  after: string
  limit?: number
}
const defaultOptions: PaginateAfterOptions = {
  idField: 'id',
  defaultLimit: 10
}

export function createCursorPaginationFilter = function (options = {}) {
  const { idField, defaultLimit } = { ...defaultOptions, ...options }
  return <M>(items: M[], queryParams: PaginateAfterQueryParams, query: Record<string, any>) => {
    const { after, limit = defaultLimit } = queryParams

    // Find the index of the item with the provided id
    const index = items.findIndex((item: any) => item[idField] === after)

    // If the item is not found, return an empty array
    if (index === -1) {
      return []
    }
    // otherwise return the next set of items after the provided id.
    return items.slice(index + 1, index + limit + 1)
  }
}
```

Now it's ready to import and use in your Feathers Pinia client:

```ts
// src/feathers-client.ts

import { createCursorPaginationFilter } from './filter.cursor-pagination'

const api = createPiniaClient(feathersClient, {
  pinia,
  idField: 'id',
  customFilters: [
    { key: '$paginate', operator: createCursorPaginationFilter() },
  ],
})
```