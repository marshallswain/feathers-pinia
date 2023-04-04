---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# The `useFind` Utility

[[toc]]

The `useFind` function is a Vue Composition API utility that takes the work out of retrieving lists of records from the
store or API server.

## Overview of Features

In version 2.0, the `useFind` utility has been completely rewritten from scratch.  It is a workflow-driven utility,
which makes it a pleasure to use. Here's an overview of its features:

- **Intelligent Fall-Through Caching** - Like SWR, but way smarter.
- **Live Queries** - For server data, reactive records. For client-side data, reactive lists and records. No need to
manually refresh data.
- **Client-Side Pagination** - Built in, sharing the same logic with `usePagination`.
- **Server-Side Pagination** - Also built in and made super easy.
- **Infinite Pagination Support** - Bind to `allData` and tell it when to load more data.
- **Declarative Workflow Support** - Compose computed params and let query as they change.
- **Imperative Workflow Support** - Pass reactive params for imperative control.

<BlockQuote>

To lighten the burden of migrating from Feathers-Vuex, the old `useFind` utility is now provided as
[`useFindWatched`](./use-find-watched). It is recommended that all new code be written with the new `useFind` API.

</BlockQuote>

## Usage

The `useFind` utility can be used from three places:

- As a [FeathersModel](/guide/use-feathers-model) method
- As a [store method](/guide/use-service)
- or standalone, as described on this page

### Recommended

You can call `useFind` directly from the Model. avoiding the need to manually pass the `store` in the params, as shown
here:

```ts
const Message = useMessageModel()

interface Props {
  userId: string | number
}
const props = defineProps<Props>()

const query = computed(() => ({ userId: props.userId }))

// client-side pagination with manual fetch
const { data, prev, next, find } = Message.useFind({ query })
await find() // retrieve data for the current query
await next() // show the next page of results
await prev() // show the previous page of results

// server-side pagination with auto fetch
const { data, prev, next } = Message.useFind({ query, onServer: true })
await next() // retrieve the next page of results
await prev() // retrieve the previous page of results
```

### Standalone

In standalone mode, you have to import `useFind` and provide the `store` option in the params object, as shown here:

```ts
import { useMessages } from '../store/messages'
import { useFind } from 'feathers-pinia'

interface Props {
  userId: string | number
}
const props = defineProps<Props>()
const messageStore = useMessages()

const query = computed(() => ({ userId: props.userId }))

// client-side pagination with manual fetch
const { data, prev, next, find } = useFind({ query, store: messageStore })
await find() // retrieve data for the current query
await next() // show the next page of results
await prev() // show the previous page of results

// server-side pagination with auto fetch
const { data, prev, next } = useFind({ query, store: messageStore, onServer: true })
await next() // retrieve the next page of results
await prev() // retrieve the previous page of results
```

## API

### `useFind(params)`

- **`params`** can be a `reactive` a `ref` or a `computed` object of the following structure:
  - **`query` {Object}** <Badge type="danger" label="required" /> a Feathers query object.
  - **`store` {Store}** <Badge type="danger" label="conditionally required" /> a Feathers-Pinia service store. It is
  only needed when using `useFind` in standalone mode. `useFind` can also be find on any service store by calling
  `store.useFind(params)`. When called from the Model or the store, you do not pass the store object in the params.
  - **`clones` {Boolean}** returns result as clones. See [Querying Data](/guide/querying-data#local-params-api)
  - **`temps` {Boolean}** includes temp records in the results. See [Querying Data](/guide/querying-data#local-params-api)
  - **`qid` {string}** an identifier for this query. Allows pagination data to be tracked separately.
  - **`onServer` {boolean}** when enabled, the internal `findInStore` getter will return only the results that match the
  current query in the `pagination` object for this store. Setting `onServer` to true gives up live lists and gives all
  control to the API server, which means you have to refetch in order for results to change.
  - **`immediate` {boolean = true}** when `onServer` is set, by default it will make an initial request. Set
  `immediate: false` to prevent the initial request.
  - **`watch` {boolean = false}** enable this to automatically query when `reactive` or `ref` params are changed. This
  does not apply to `computed` params, since they are automatically watched.

### Returned Object

The `useFind` function is actually a factory function that returns an instance of the `Find` class. So when you call
`useFind` you get back an object with the following properties:

#### Params & Config

- **`params` {Ref Object}** are an internal, `ref` copy of the initially-provided params.
- **`store` {Store}** is a reference to the associated store.
- **`onServer` {boolean}** indicates whether this instance makes requests to the API server. Defaults to `false`.
- **`isSsr` {Computed boolean}** will be true if `isSsr` was passed into the `useService` options for this service
store. Useful for awaint the `request` during SSR.
- **`qid` {Ref string}** the query identifier. Causes this query's pagination data to be stored under its own `qid` in
`store.pagination`.

#### Data

- **`data` {Ref Array}** the array of results.
- **`allData` {Ref Array}** all results for the matching query or server-retrieved data. With `onServer`, will return
the correct results, even with custom query params that the store does not understand.
- **`total` {Computed number}** One of two things: For client-side results, the total number of records in the store
that match the query. For `onServer` results, the total number of records on the server that match the query.

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

## Declarative vs. Imperative Flow

We stated earlier that the new `useFind` supports both declarative and imperative workflows. What's the difference and
what does it mean in the code?  The short definitions are these:

- Imperative code gives commands at each step and expects to be obeyed. The figurative verbal summary would be "Do this.
Now do this. Now do that."
- Declarative code gives a full specification of how to act based on conditions. You sort of teach the code correct
principles and let it govern itself. The figurative verbal summary would be "Here are instructions of how to respond to
different conditions. Watch for those conditions and act accordingly."

So imperative code is like pushing instructions to the computer one line at a time.  Declarative code is more like
having the computer pull from a set of instructions based on conditions.

In Vue, the declarative APIs include `computed` and `watch` and other APIs like `watchEffect` that run by watching other
values.

### Declarative Example

To implement `useFind` declaratively, we can use computed params.  The below example creates four declarative queries
which watch a value called `date`. Suppose you have a set of tasks related to features which users can upvote.  Tasks
have an `isCompleted` attribute, an `upvotes` count and a `dueDate` property.  Now let's suppose we're going to build a
tasks dashboard. You want to see various types of task lists all based on a chosen date. So let's pretend that these are
our requirements:

- The 5 most-upvoted tasks for the day
- The 5 least-upvoted tasks for the day
- Twenty completed tasks for the day
- The 10 most-upvoted, incomplete tasks for the day

```ts
import { useTasks } from '../stores/tasks'

const taskStore = useTasks()

const date = ref(new Date())

// 5 most-upvoted tasks for the day
const paramsMostUpvoted = computed(() => ({ 
  query: { 
    dueDate: date.value, 
    $sort: { upvotes: -1 },
    $limit: 5,
  },
  onServer: true
}))
const { data: mostUpvoted } = taskStore.useFind(paramsMostUpvoted)

// 5 least-upvoted tasks for the day
const paramsLeastUpvoted = computed(() => ({ 
  query: { 
    dueDate: date.value, 
    $sort: { upvotes: 1 },
    $limit: 5,
  },
  onServer: true
}))
const { data: leastUpvotedTasks } = taskStore.useFind(paramsLeastUpvoted)

// Twenty completed tasks for the day
const paramsComplete = computed(() => ({ 
  query: { 
    dueDate: date.value, 
    isCompleted: true,
    $limit: 20,
  },
  onServer: true
}))
const { data: completedTasks } = taskStore.useFind(paramsComplete)

// Ten most-voted-for, incomplete tasks for the day
const paramsIncomplete = computed(() => ({ 
  query: { 
    dueDate: date.value, 
    isCompleted: false,
    $sort: { upvotes: -1 },
    $limit: 10,
  },
  onServer: true
}))
const { data: incompleteTasks } = taskStore.useFind(paramsIncomplete)
```

In the above scenario, we can bind to the task lists in the template and display the four reports.  Now, what code do we
need to write to show data for a different date?  Let's see what a handler looks like when we have written declarative
code.

### Declarative Handler

With declarative code, we only need to change the `date` variable.  The computed properties will tell `useFind` to fetch
new data, ✨automagically✨. There's no need to manually fetch. When the data returns, the lists will update on their
own. As long as your template is rendering correctly, there's no more work to do.

```ts
// A handler to change the date from the UI
const setDate = (newDate) => {
  date.value = newDate
}
```

### Imperative Example

To write the example as imperative-focused code, we only need to replace the `computed` properties with `reactive` ones.
A `reactive` object will not autmoatically update when sub-values like `date` change, so we just have to pass the date
to each query.  Now we have more repetition. Notice how the same date is specified four times.

```ts
import { useTasks } from '../stores/tasks'

const taskStore = useTasks()

// 5 most-upvoted tasks for the day
const paramsMostUpvoted = reactive({ 
  query: { 
    dueDate: new Date(), 
    $sort: { upvotes: -1 },
    $limit: 5,
  },
  onServer: true
})
const { data: mostUpvoted, find: findMostUpvoted } = taskStore.useFind(paramsMostUpvoted)

// 5 least-upvoted tasks for the day
const paramsLeastUpvoted = reactive({ 
  query: { 
    dueDate: new Date(), 
    $sort: { upvotes: 1 },
    $limit: 5,
  },
  onServer: true
})
const { data: leastUpvotedTasks, find: findLeastUpvoted } = taskStore.useFind(paramsLeastUpvoted)

// Twenty completed tasks for the day
const paramsComplete = reactive({ 
  query: { 
    dueDate: new Date(), 
    isCompleted: true,
    $limit: 20,
  },
  onServer: true
})
const { data: completedTasks, find: findComplete } = taskStore.useFind(paramsComplete)

// Ten most-voted-for, incomplete tasks for the day
const paramsIncomplete = reactive({ 
  query: { 
    dueDate: new Date(), 
    isCompleted: false,
    $sort: { upvotes: -1 },
    $limit: 10,
  },
  onServer: true
})
const { data: incompleteTasks, find: findIncomplete } = taskStore.useFind(paramsIncomplete)
```

### Imperative Handler

What does a handler look like for an imperative-minded example of our test scenario?  Let's take a look.  First, we have
to update each set of params, since they can't automatically compute themselves (that's what `computed` properties are
for). Then we have to manually tell `useFind` to request the new data.

```ts
// A handler to change the date for each query
const setDate = async (newDate) => {
  paramsMostUpvoted.query.date = newDate
  paramsLeastUpvoted.query.date = newDate
  paramsComplete.query.date = newDate
  paramsIncomplete.query.date = newDate
  // fetch data for the new date
  await Promise.all([
    findMostUpvoted()
    findLeastUpvoted()
    findComplete()
    findIncomplete()
  ])
}
```

Look how much longer the imperative code is!  We had to manually tell `useFind` to update the date in each set of
params. Then we had to manually command each one to fetch the new data.  With declarative-minded code, we can change the
`date` as the source of truth. When it receives a `computed` property, `useFind` knows to re-fetch when changes occur.

So is it better to write declarative code? The answer is usually yes. It often makes the most sense to write declarative
code, but some situations will work better with imperative code.  When writing in Vue, sometimes declarative code will
lead to infinite loops. If you have three computed variables that watch each other, they will run forever. This code
would create an infinite loop:

```ts
const a = computed(() => c.value + 1)
const b = computed(() => a.value + 1)
const c = computed(() => b.value + 1)
```

Can you see the loop? It will start as soon as you try to read any of the variables.

- When reading `a` it will try to read `c` before adding `1`.
- Reading `c` will cause it to try to read `b` before adding `1` to the return value of `b`.
- But when reading `b`, it will try to read `a` again.

None of the variables will ever return a value because they'll keep reading each other in a loop. The loop will go on
until the allocated memory space for tracking current operations is too full, also known as a "stack overflow".

Declarative queries can work exactly the same way. When queries re-run based on other data and that logic goes in a
loop, you'll end up with an asynchronous stack overflow. In order to fix the problem, you can switch one of them to
imperative to break the automated flow. That's why `useFind` supports both workflows.

<BlockQuote>

In the above scenario, if you use the [`feathers-batch` plugins](https://github.com/feathersjs-ecosystem/feathers-batch)
on the client and server, it will automatically group all queries into a single request. It really speeds up your API
with almost zero effort on your part.  Give it a try!

</BlockQuote>

## Examples

Let's look at the two most-common use cases: client-side pagination and server-side pagination.

### Client Paging with Live Lists

If you want live-updating lists, use client-side pagination. You set the page size in the initial query. Then you can
use the `find` utility to request multiple pages of data. The example below sets `$limit` to `10`, which determines the
page size. It then retrieves 25 pages of data (`$limit: 250`) in a separate query.

```ts
import { usePosts } from '../stores/posts'

const postStore = usePosts()

// Set page size with $limit in the initial query
const { data, next, prev, find } = postStore.useFind({ query: { $limit: 10, $skip: 0 } })

// fetch multiple pages of data
await find({ query: { $limit: 250 } })

// move to the next page
await next()

// move to the previous page
await prev()
```

### Server Paging, Auto Fetch

Another common use case is server-side pagination (gives the server full control and disables live-updating lists).
Enable it by passing `onServer` in the params. You can also pull out `isPending` to show a status indicator when a
request is pending. That's it!

<BlockQuote>

When you enable `onServer`, all control is given to the server, which disables live list updates. For live lists, use
client-side pagination, as shown in the previous example.

</BlockQuote>

```ts
import usePosts from '../stores/posts'

const postStore = usePosts()

const { data, next, prev, isPending } = postStore.useFind({ 
  query: { $limit: 10, $skip: 0 }, 
  onServer: true 
})

// move to the next page
await next()

// move to the previous page
await prev()
```
