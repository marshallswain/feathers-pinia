---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# The `useFind` Method

Learn how to perform automatic queries with built-in pagination support.

[[toc]]

The `service.useFind` function is a Vue Composition API utility that takes the work out of retrieving lists of records
from the store or API server.

## Overview of Features

The `service.useFind` utility is a workflow-driven utility. Here's an overview of its features:

- **Intelligent Fall-Through Caching** - Like SWR, but way smarter.
- **Live Queries** - For server data, reactive records. For client-side data, reactive lists and records. No need to
manually refresh data.
- **Client-Side Pagination** - Built in, sharing the same logic with `usePagination`.
- **Server-Side Pagination** - Also built in and made super easy.
- **Infinite Pagination Support** - Bind to `allLocalData` and tell it when to load more data.
- **Declarative Workflow Support** - Compose computed params and let query as they change.
- **Conditional Querying** - Use the `queryWhen` API to prevent extra queries.

## Usage

In Feathers-Pinia 3.0, the `useFind` utility is only available as a service method.

```ts
interface Props {
  userId: string | number
}
const props = defineProps<Props>()

const { api } = useFeathers()

const params = computed(() => {
  return { query: { userId: props.userId } }
})

// client-side pagination with manual fetch
const messages$ = api.service('messages').useFind(params)
await api.service('messages').find({ query: { $limit: 100 } }) // retrieve data for the current query

await messages$.next() // show the next page of results
await messages$.prev() // show the previous page of results
```

Or use hybrid pagination, which is server-side pagination with realtime updates:

```ts
// server-side pagination with auto fetch
const messages$ = api.service('messages').useFind(params, { paginateOn: 'hybrid' })
await messages$.next() // retrieve the next page of results
await messages$.prev() // retrieve the previous page of results
```

## API

Important: starting in Feathers-Pinia 4.0, `useFind` returns a `reactive` object instead of an object of refs. If you
destructure the object, reactivity will break. See [Common Pitfalls](/guide/troubleshooting) for more ways to
troubleshoot reactivity.

### `service.useFind(params)`

- **`params`** can be a `reactive` a `ref` or a `computed` object of the following structure:
  - **`query` {Object}** <Badge type="danger" label="required" /> a Feathers query object.
  - **`clones` {Boolean}** returns result as clones. See [Querying Data](/data-stores/querying-data#local-params-api)
  - **`temps` {Boolean}** includes temp records in the results. See [Querying Data](/data-stores/querying-data#local-params-api)
  - **`qid` {string}** an identifier for this query. Allows pagination data to be tracked separately.
  
- `options`
  - **`paginateOn` {string}** can be `'client'`, `'server'`, or `'hybrid'` Default is `'client'`.
    - when set to `'client'`, you need to manually make API queries using `service.find()`, then you can paginate on
    that data without making additional requests.
    - when set to `'server'`, the internal `findInStore` getter will return only the results that match the current
    query in the `pagination` object for this store. Setting `paginate: 'server'` gives up live lists and gives all
    control to the API server, which means you have to refetch in order for results to change. Refetching currently
    happens whenever a `created`, `updated`, or `removed` event is provided. This will potentially be refined in the
    future.
    - when set to `'hybrid'`, you get server-side pagination with live lists. This will likely become the default in
    the future.
  - **`pagination` {Object}** an object containing two refs: `$limit` and `$skip`. This allows you to synchronize the
  internally-controlled pagination with UI-bound `$limit` and `$skip` properties.
  - **`immediate` {boolean = true}** when `paginateOn: 'server'` is set, by default it will make an initial request. Set
  `immediate: false` to prevent the initial request.
  - **`watch` {boolean = false}** enable this to automatically query when `reactive` or `ref` params are changed. This
  does not apply to `computed` params, since they are automatically watched.

### Returned Object

The `useFind` function is actually a factory function that returns an instance of the `Find` class. So when you call
`useFind` you get back an object with the following properties:

#### Params & Config

- **`isSsr` {Computed boolean}** will be true if `isSsr` was passed into the `useService` options for this service
store. Useful for awaint the `request` during SSR.
- **`qid` {Ref string}** the query identifier. Causes this query's pagination data to be stored under its own `qid` in
`store.pagination`.

#### Data

- **`data` {Ref Array}** the array of results.
- **`allLocalData` {Ref Array}** all results for the matching query or server-retrieved data. With `paginateOn: 'server'`,
will return the correct results, even with custom query params that the store does not understand.
- **`total` {Computed number}** One of two things: For client-side results, the total number of records in the store
that match the query. For `paginateOn: 'server'` results, the total number of records on the server that match the query.

#### Query Tracking

- **`currentQuery` {Computed Object}** an object containing the following:
  - **`qid` {string}** the query identifier
  - **`ids` {number[]}** the ids in this page of data
  - **`items` {Record[]}** the items in this page of data
  - **`total` {number}** the total number of items matching this query
  - **`queriedAt` {number}** the timestamp when this page of data was retrieved. Useful when used with `queryWhen` to
  prevent repeated queries during a period of time.
  - **`queryState` {Object}** a pagination object from the store
- **`latestQuery` {Computed Object}** an object containing the following:
  - **`pageId` {string}** stable stringified page params
  - **`pageParams` {Object}** the page params
  - **`queriedAt` {number}** timestamp when this page of records was received from the server.
  - **`query` {Object}** the query params, including $limit and $skip.
  - **`queryId` {string}** stable-stringified query params
  - **`queryParams` {Object}** the query params, excluding $limit and $skip.
  - **`total` {number}** the total number of records matching the query.
- **`previousQuery` {Computed Object}** an object with the same format as `latestQuery`.

#### Data Retrieval & Watching

- **`find` {Function}** the same as `store.find`.
- **`request` {Ref Promise}** the promise for the current request.
- **`requestCount` {Computed number}** the number of requests sent by this `Find` instance.
- **`queryWhen` {Function}** pass a function that returns a boolean into `queryWhen` and that function will be run
before retrieving data. If it returns false, the query will not happen.
- **`findInStore` {Function}** the same as `store.findInStore`.

#### Request State

- **`isPending` {Computed boolean}** returns true if the current `request` is pending.
- **`haveBeenRequested` {Computed boolean}** returns true if any request has been sent by this `Find` instance. Never
resets for the life of the instance.
- **`haveLoaded` {Computed boolean}** essentially the same purpose, but opposite of `isPending`. Returns true once the
request finishes.
- **`error` {Computed error}** will contain any error. The error will be cleared when a new request is made or when
manually calling `clearError`.
- **`clearError` {Function}** call this function to clear the `error`.

#### Pagination Utils

- **`limit` {Ref number}** the pagination `$limit`. Updating this value will change the internal pagination and the
returned `data`.
- **`skip` {Ref number}** the pagination `$skip`. Updating this value will change the internal pagination and the
returned `data`.
- **`pageCount` {Computed number}** the number of pages for the current query params.
- **`currentPage` {Ref number}** the current page number. Can be set to change to that page, or use `toPage(pageNumber)`.
- **`canPrev` {Computed boolean}** returns true if there is a previous page.
- **`canNext` {Computed boolean}** returns true if there is a next page.
- **`next` {Function}** moves to the next page of data.
- **`prev` {Function}** moves to the previous page of data.
- **`toStart` {Function}** moves to the first page of data.
- **`toEnd` {Function}** moves to the last page of data.
- **`toPage(pageNumber)` {Function}**

## Examples

Let's look at the two most-common use cases: client-side pagination and server-side pagination.

### Client Paging with Live Lists

If you want live-updating lists, use client-side pagination. You set the page size in the initial query. Then you can
use the `find` utility to request multiple pages of data. The example below sets `$limit` to `10`, which determines the
page size. It then retrieves 25 pages of data (`$limit: 250`) in a separate query.

```ts
const { api } = useFeathers()

const params = computed(() => ({ query: { $limit: 10, $skip: 0 } }))
// Set page size with $limit in the initial query
const posts$ = api.service('posts').useFind(params)
// fetch multiple pages of data
await api.service('posts').find({ query: { $limit: 250 } })

// move to the next page
await posts$.next()

// move to the previous page
await posts$.prev()
```

### Server Paging, Auto Fetch

Another common use case is server-side pagination (gives the server full control and disables live-updating lists).
Enable it by passing `paginateOn: 'server'` in the options. You can also pull out `isPending` to show a status indicator
when a request is pending. That's it!

<BlockQuote>

When you enable `paginateOn: 'server'`, all control is given to the server, which disables live list updates. For live
lists, use client-side pagination, as shown in the previous example.

</BlockQuote>

```ts
const { api } = useFeathers()

// pagination attributes can go inside params if you don't need external control,
// like for Vuetify or other components.
const pagination = { $limit: ref(10), $skip: ref(0) }
const params = computed(() => ({ query: {} }))
const posts$ = api.service('posts').useFind(params, {
  pagination,
  paginateOn: 'server'
})

// move to the next page
await posts$.next()

// move to the previous page
await posts$.prev()
```
