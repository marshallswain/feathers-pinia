<script setup>
import Badge from '../components/Badge.vue'
</script>

# useFind

The `useFind` utility reduces boilerplate for querying with fall-through cache and realtime updates. To get started with it you provide a `model` class and a computed `params` object.

Let's use the example of creating a User Guide, where we need to pull in the various `Tutorial` records from our `tutorials` service. We'll keep it simple in the template and just show a list of the names.

The goal with the examples is to focus as much as possible on functionality and not boilerplate. As such, all examples use [auto-import](https://github.com/antfu/unplugin-auto-import) for Vue APIs like `computed` and `ref`. They also use Vue's `script setup` feature. Both features come preinstalled with the [Vitesse Template for Vue](https://github.com/antfu/vitesse) and the [Vitesse-Feathers-Pinia Demo](https://github.com/marshallswain/vitesse-feathers-pinia).

```vue
<template>
  <ul>
    <li v-for="tutorial in tutorials" :key="tutorial._id">
      {{ tutorial.name }}
    </li>
  </ul>
</template>

<script setup>
import { useFind } from 'feathers-pinia'
import { useTutorials } from '../store/tutorials'

// 1. Register and use the store
const tutorialStore = useTutorials()

// 2. Create a computed property for the params
const tutorialsParams = computed(() => {
  return {
    query: {},
  }
})
// 3. Provide the Model class and params in the options
const tutorialsData = useFind({ model: tutorialStore.Model, params: tutorialsParams })
const tutorials = tutorialsData.items;
</script>
```

Let's review each of the numbered comments, above:

1. Register and use the store. Since Pinia uses independent stores, the best practice is to import and use them wherever needed. Once you've called the equivalent to `useTutorials`, the `Model` property can be pulled from the store.
2. Create a computed property for the params. Return an object with a nested `query` object.
3. Provide the Model class and params in the options

## Options

Here's a look at the TypeScript definition for the `UseFindOptions` interface.

```ts
interface UseFindOptions {
  model: Function
  params: Params | Ref<Params>
  fetchParams?: Params | Ref<Params>
  queryWhen?: ComputedRef<boolean> | QueryWhenFunction
  qid?: string
  immediate?: boolean
}
```

And here's a look at each individual property:

- `model` must be a Feathers-Pinia Model class. The Model's `find` and `findInStore` methods are used to query data.
- `params` is a FeathersJS Params object OR a Composition API `ref` (or `computed`, since they return a `ref` instance) which returns a Params object.
  - When provided alone (without the optional `fetchParams`), this same query is used for both the local data store and the API requests.
  - Explicitly returning `null` will prevent an API request from being made.
  - You can use `params.qid` to dynamically specify the query identifier for any API request. The `qid` is used for tracking pagination data and enabling the fall-through cache across multiple queries.
  - Set `params.paginate` to `true` to use server-side pagination. Realtime updates will continue to come into the store. UI results will only update when another response is sent from the server for the same query.
  - Set `params.debounce` to an integer and the API requests will automatically be debounced by that many milliseconds. For example, setting `debounce: 1000` will assure that the API request will be made at most every 1 second.
  - Set `params.temps` to `true` to include temporary (local-only) items in the results. Temporary records are instances in the store without a server-assigned id. They have not been saved to the database, yet.
  - Set `params.copies` to `true` to include cloned items in the results. The queried items get replaced with the corresponding copies from `copiesById`
- `fetchParams` This is a separate set of params that, when provided, will become the params sent to the API server. The `params` will then only be used to query data from the local data store.
  - Explicitly returning `null` will prevent an API request from being made (but only for Vue 3. For Vue 2, use `queryWhen`).
- `queryWhen` provides a logical separation for preventing API requests _outside_ of the `params`. It must be a `computed` property that returns one of the following:
  - a `boolean`
  - a `QueryWhenFunction`, receiving a `QueryWhenContext` and returning a boolean. <Badge text="0.25.0+" />
- `qid` allows you to specify a query identifier (used in the pagination data in the store). This can also be set dynamically by returning a `qid` in the params.
- `immediate`, which is `true` by default, determines if the internal `watch` should fire immediately. Set `immediate: false` and the query will not fire immediately. It will only fire on subsequent changes to the params.

## Returned Attributes

Notice the `tutorialsData` in the previous example. You can see that there's an `tutorialsData.items` property, which is returned at the bottom of the `setup` method as `tutorials`. There are many more attributes available in the object returned from `useFind`. We can learn more about the return values by looking at its TypeScript interface, below.

```ts
interface UseFindData {
  items: Ref<any>
  paginationData: Ref<object>
  servicePath: Ref<string>
  qid: Ref<string>
  isPending: Ref<boolean>
  haveBeenRequested: Ref<boolean>
  haveLoaded: Ref<boolean>
  error: Ref<Error>
  debounceTime: Ref<number>
  latestQuery: Ref<object>
  isLocal: Ref<boolean>
  find: Function
  isSsr: Ref<boolean>
  request: Ref<Promise<Request> | null>
}
```

Let's look at the functionality that each one provides:

- `items` is the list of results. By default, this list will be reactive, so if new items are created which match the query, they will show up in this list automagically.
- `servicePath` is the FeathersJS service path that is used by the current model. This is mostly only useful for debugging.
- `isPending` is a boolean that indicates if there is an active query. It is set to `true` just before each outgoing request. It is set to `false` after the response returns. Bind to it in the UI to show an activity indicator to the user.
- `haveBeenRequested` is a boolean that is set to `true` immediately before the first query is sent out. It remains true throughout the life of the component. This comes in handy for first-load scenarios in the UI.
- `haveLoaded` is a boolean that is set to true after the first API response. It remains `true` for the life of the component. This also comes in handy for first-load scenarios in the UI.
- `isLocal` is a boolean that is set to true if this data is local only.
- `qid` is currently the primary `qid` provided in params. It might become more useful in the future.
- `debounceTime` is the current number of milliseconds used as the debounce interval.
- `latestQuery` is an object that holds the latest query information. It populates after each successful API response. The information it contains can be used to pull data from the `paginationData`.
- `paginationData` is an object containing all of the pagination data for the current service.
- `error` is null until an API error occurs. The error object will be serialized into a plain object and available here.
- `find` is the find method used internally. You can manually make API requests. This is most useful for when you have `paginate: true` in the params. You can manually query refreshed data from the server, when desired. Calling `find` actually calls in the internal `findProxy`, so if you have `debounceTime` set, requests will be debounced.
- `isSsr` is a boolean that matches the value of the `ssr` option in either `setupFeathersPinia` or `defineStore`. <Badge text="0.27.0+" />
- `request` will contain the promise for any active request. <Badge text="0.27.0+" />

## Conditionally Running Queries

There are two ways of controlling whether or not queries go out.

- Return `null` in the `params` or `fetchParams`. (Vue 3, only)
- Use the `queryWhen` property. This is the recommended option.

The `queryWhen` property accepts a computed property that returns either a boolean OR a function that returns a boolean.

### `queryWhen` as a Computed Boolean

The below example uses a boolean. No query is made initially, because `queryWhen` returns false.  When the timeout sets `isReady` to true, `queryWhen` returns true and Vue's wonderful reactivity layer automagically fires the request.  If you were to toggle `isReady`, each time it evaluates to `true` the request will go out again.

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFind } from 'feathers-pinia'
import { useUsers } from '~/store/users.ts'

const userStore = useUsers()

const isReady = ref(false)
const params = computed(() => {
  return { query: { $limit: 10, $skip: 0 } }
})
const queryWhen = computed(() => isReady.value)
const { items } = useFind({
  model: userStore.Model,
  params,
  queryWhen
})

setTimeout(() => {
  isReady.value = true
}, 5000)
</script>
```

### `queryWhen` as a Computed Function <Badge text="0.25.0+" />

The `queryWhen` property can also be implemented as a computed property that returns a function. The function receives a `context` object and needs to return a boolean.  The `context` object has some useful information that you can use to determine whether to return `true` or `false`. Here's what `context` looks like:

```ts
export interface QueryWhenContext {
  items: ComputedRef<AnyData[]>
  queryInfo: QueryInfo
  qidData: PaginationStateQid
  queryData: PaginationStateQuery
  pageData: PaginationStatePage
}
```

The `qidData`, `queryData`, and `pageData` properties all come from the service store's `pagination` object, which contains useful information for every query.  Let's review the `pagination` object before we see how to use the `context` object.

#### Pagination State <Badge text="0.25.0+" />

The `qid`, `queryId`, and `pageId` in the below structure are all determined by the attributes in the params.

- `qid` comes from `params.qid`. All queries with the same `qid` will be kept in the same object. The `mostRecentQuery` attribute contains queryInfo about where in the pagination structure you'll find the most recent query.
- `queryId` is a stringified representation of all attributes in `params.query` except `$limit` and `$skip`.
- `pageId` is a stringified representation of `$limit` and `$skip`, which are the page-level attributes.

```ts
// This is a pseudo-TypeScript interface that illustrates the pagination structure.
interface PaginationState {
  [qid: string]: {        // This level is the `qidData`
    [queryId: string]: {  // This level is the `queryData`
      [pageId: string]: { // This level is the `pageData`
        ids: Id[]
        pageParams: QueryPagination
        queriedAt: number // timestamp
        ssr: boolean
      }
      queryParams: Query
      total: number
    }
    mostRecent: MostRecentQuery
  }
}
interface MostRecentQuery {
  pageId: string
  pageParams: QueryPagination
  queriedAt: number
  query: Query
  queryId: string
  queryParams: Query
  total: number
}
```

#### `queryWhen` Function Example <Badge text="0.25.0+" />

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFind } from 'feathers-pinia'
import { useUsers } from '~/store/users.ts'

const userStore = useUsers()

const params = computed(() => {
  return { query: { $limit: 10, $skip: 0 } }
})
// Notice the two arrow functions. This is a computed that returns a function.
// Lots of return examples here. Not valid JS, just for illustration.  ;)
const queryWhen = computed(() => (context) => {
  const { items, queryInfo, qidData, queryData, pageData } = context

  // Allow the query if we don't have any items. If you do this you have to manually call find(), as done in the timeout.
  return !items.length

  // Allow the query if over 5 minutes have passed
  return !pageData || pageData?.queriedAt < new Date.getTime() - 300_000
})
const { items, find } = useFind({
  model: userStore.Model,
  params,
  queryWhen
})

setTimeout(() => {
  find()
}, 5000)
</script>
```

A couple of best practices

1. Always use `$limit` and `$skip` in queries. This allows Feathers-Pinia to store more accurate pagination data.
2. Recognize that pagination-related objects will be `undefined` until after the first query response. This is why we use the conditional in `pageData?`.queriedAt`. It will only exist if a matching query has previously been made.

## Working with Refs

Pay special attention to the properties of type `Ref`, in the TypeScript interface, above. Those properties are Vue Composition API `ref` instances. This means that you need to reference their value by using `.value`. In the next example the `completeTodos` and `incompleteTodos` are derived from the `todos`, using `todos.value`

```html
<template>
  <div>
    <li
      v-for="tutorial in tutorials"
      :key="tutorial._id"
    >
      {{ tutorial.name }}
    </li>
  </div>
</template>

<script setup>
  import { useFind } from 'feathers-pinia'
  import { useTodos } from '../store/todos'

  const todoStore = useTodos()

  const params = computed(() => {
    return {
      query: {},
    }
  })
  const { items: todos } = useFind({ model: todoStore.Todo, params })
  // Notice the "todos.value"
  const completeTodos = computed(() => todos.value.filter((todo) => todo.isComplete))
  const incompleteTodos = computed(() => todos.value.filter((todo) => !todo.isComplete))
</script>
```
