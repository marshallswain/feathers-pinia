---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# The `useFind` Utility

[[toc]]

## Overview of Features

In version 1.0, the `useFind` utility has been completely rewritten from scratch.  It is a workflow-driven utility, which makes it a pleasure to use. Here's an overview of its features:

- **Intelligent Fall-Through Caching** - Like SWR, but way smarter.
- **Client-Side Pagination** - Built in, sharing the same logic with `usePagination`.
- **Server-Side Pagination** - Also built in.
- **Infinite Pagination Support** - Bind to `allData` and tell it when to load more data.
- **Declarative Workflow Support** - Compose computed params and let query as they change.
- **Imperative Workflow Support** - Pass reactive params for imperative control.

<BlockQuote>

To lighten the burden of migrating with this breaking change, the old `useFind` utility is now provided as [`useFindWatched`](./use-find-watched).

</BlockQuote>

## API

### `useFind(params)`

### Returned Utilities

## Declarative vs. Imperative Flow

We stated earlier that the new `useFind` supports both declarative and imperative workflows. What's the difference and what does it mean in the code?  The short definitions are these:

- Imperative code gives commands at each step and expecting to be obeyed. The figurative verbal summary would be "Do this. Now do this. Now do that."
- Declarative code gives a full specification of how to act based on conditions. You sort of teach the code correct principles and let it govern itself. The figurative verbal summary would be "Here are instructions of how to respond to different conditions. Watch for those conditions and act accordingly."

So imperative code is like pushing instructions to the computer one line at a time.  Declarative code is more like having the computer pull from a set of instructions based on conditions.

In Vue, the declarative APIs include `computed` and `watch` and other APIs like `watchEffect` that run by watching other values.

### Declarative Example

To implement `useFind` declaratively, we can use computed params, as shown here.  This example runs three requests based on a shared value. Suppose you have a set of tasks related to features which users can upvote.  Tasks have an `isCompleted` attribute, an `upvotes` count and a `dueDate` property.  Now let's suppose we're going to build a dashboard where you want to see a few lists based on the date picked

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
  paginateOnServer: true
}))
const { data: mostUpvoted } = taskStore.useFind(paramsMostUpvoted)

// 5 least-upvoted tasks for the day
const paramsLeastUpvotedTasks = computed(() => ({ 
  query: { 
    dueDate: date.value, 
    $sort: { upvotes: 1 },
    $limit: 5,
  },
  paginateOnServer: true
}))
const { data: leastUpvotedTasks } = taskStore.useFind(paramsLeastUpvoted)

// Twenty completed tasks for the day
const paramsComplete = computed(() => ({ 
  query: { 
    dueDate: date.value, 
    isCompleted: true,
    $sort: { upvotes: -1 },
    $limit: 10,
  },
  paginateOnServer: true
}))
const { data: completedTasks } = taskStore.useFind(pastParams)

// Ten most-voted-for, incomplete tasks for the day
const paramsIncomplete = computed(() => ({ 
  query: { 
    dueDate: date.value, 
    isCompleted: false,
    $limit: 20,
  },
  paginateOnServer: true
}))
const { data: incompleteTasks } = taskStore.useFind(paramsIncomplete)
```

In the above scenario, we can bind lists in the template to display the four types of data.  Now, what code do we need to write to show data for a different date?  Let's see what a handler looks like when we have written declarative code.

### Declarative Handler

With declarative code, we only need to change the `date` variable.  The computed properties will tell `useFind` to fetch new data, automagically. There's no need to manually fetch. When the data returns, the lists will update on their own. As long as your template is rendering correctly, there's no more work to do.

```ts
// A handler to change the date from the UI
const setDate = (newDate) => {
  date.value = newDate
}
```

## Imperative Example

To write the example as imperative-focused code, we only need to replace the `computed` properties with `reactive` ones. A `reactive` object will not autmoatically update when sub-values like `date` change, so we just have to pass the date to each query.  Now we have more repetition. Notice how the same date is specified four times.

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
  paginateOnServer: true
})
const { data: mostUpvoted, find: findMostUpvoted } = taskStore.useFind(paramsMostUpvoted)

// 5 least-upvoted tasks for the day
const paramsLeastUpvotedTasks = reactive({ 
  query: { 
    dueDate: new Date(), 
    $sort: { upvotes: 1 },
    $limit: 5,
  },
  paginateOnServer: true
})
const { data: leastUpvotedTasks, find: findLeastUpvoted } = taskStore.useFind(paramsLeastUpvoted)

// Twenty completed tasks for the day
const paramsComplete = reactive({ 
  query: { 
    dueDate: new Date(), 
    isCompleted: true,
    $sort: { upvotes: -1 },
    $limit: 10,
  },
  paginateOnServer: true
})
const { data: completedTasks, find: findComplete } = taskStore.useFind(pastParams)

// Ten most-voted-for, incomplete tasks for the day
const paramsIncomplete = reactive({ 
  query: { 
    dueDate: new Date(), 
    isCompleted: false,
    $limit: 20,
  },
  paginateOnServer: true
})
const { data: incompleteTasks, find: findIncomplete } = taskStore.useFind(paramsIncomplete)
```

### Imperative Handler

What does a handler look like for an imperative-minded example of our test scenario?  Let's take a look.  First, we have to update each set of params, since they can't automatically compute themselves (that's what `computed` properties are for).

```ts
// A handler to change the date for each query
const setDate = (newDate) => {
  paramsMostUpvoted.query.date = newDate
  paramsLeastUpvotedTasks.query.date = newDate
  paramsComplete.query.date = newDate
  paramsIncomplete.query.date = newDate
  // query more data
  await Promise.all([
    findMostUpvoted()
    findLeastUpvoted()
    findComplete()
    findIncomplete()
  ])
}
```

Look how much longer the above code is!  We had to manually tell it to update the date in each query, then we had to manually fetch each one.  With declarative-minded code, we can change the `date` as the source of truth.  The computed property also makes `useFind` query when changes occur.

<BlockQuote>

In the above scenario, if you use the `feathers-batch` plugins on the client and server, it will automatically group all queries into a single request.  They don't even have to be to the same service, only to the same server. It will really speed up your API.

</BlockQuote>

## Examples
