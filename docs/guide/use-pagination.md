# usePagination

The `usePagination` utility is designed to pair with `useFind`. It aids in creating custom pagination interfaces.

## Setup Steps

1. Create a reactive pagination object. It needs two properties:  `$limit` and`$skip`:

    ```ts
    const pagination = reactive({ $limit: 5, $skip: 0 })
    ```

2. Create a computed `params` object that spreads the pagination props into `params.query`. If pagination happens on the server, set `params.paginate` to `true`.

    ```ts
    const params = computed(() => {
      return {
        query: {
          ...pagination
        },
        paginate: true,
      }
    })
    ```

3. Pass the `params` object into the `useFind` utility, pulling the `items` and `lastUsedQuery` out of the return value:

    ```ts
    const { items: users, latestQuery } = useFind({ model: userStore.Model, params })
    ```

4. Pass the `pagination` and `latestQuery` to the `usePagination` utility, pulling out whichever utilities you can use to create your pagination experience.

    ```ts
    const { next, prev, canNext, canPrev, currentPage, pageCount, toPage, toStart, toEnd } = usePagination(pagination, latestQuery)
    ```

So the full example script looks like this:

```ts
import { useFind, usePagination } from 'feathers-pinia'

const pagination = reactive({ $limit: 5, $skip: 0 })
const params = computed(() => {
  return {
    query: {
      ...pagination
    },
    paginate: true,
  }
})
const { items: users, latestQuery } = useFind({ model: userStore.Model, params })
const {
  next,
  prev,
  canNext,
  canPrev,
  currentPage,
  pageCount,
  toPage,
  toStart,
  toEnd
} = usePagination(pagination, latestQuery)
```

## Return Values

The return value from `usePagination` is an object containing these 9 utilities:

- `next() {Function}` calling `next` moves to the next page by incrementing the value of `$skip`. When connected to a "Next Page" button, it enables viewing the next set of results.
- `prev() {Function}` calling `prev` moves to the previous page by decreasing `$skip`. When connected to a `Previous Page" button, it enables viewing the previous set of results.
- `canNext {Computed<Boolean>}` will be `true` if there is a next page. If it's false, you can style a "Next Page" button to let the user know the that the functionality is not available.
- `canPrev {Computed<Boolean>}` will be `true if there is a previous page. If it's false, you can style a "Previous Page" button to let the user know that the functionality is not available.
- `currentPage {Computed<Number>}` is the current page number in the overall set of results.
- `pageCount {Computed<Number>}` is the total number of pages that are available in the set of results.
- `toPage(pageNumber) {Function}` navigates to the page number provided as the first argument.
- `toStart() {Function}` goes to the first page.
- `toEnd() {Function}` goes to the last page.

Check out the working example [vitesse-feathers-pinia-example](https://github.com/marshallswain/vitesse-feathers-pinia-example).
