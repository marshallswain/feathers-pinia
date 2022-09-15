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

- Imperative code gives commands at each step and expects to be obeyed. The figurative verbal summary would be "Do this. Now do this. Now do that."
- Declarative code gives a full specification of how to act based on conditions. You sort of teach the code correct principles and let it govern itself. The figurative verbal summary would be "Here are instructions of how to respond to different conditions. Watch for those conditions and act accordingly."

So imperative code is like pushing instructions to the computer one line at a time.  Declarative code is more like having the computer pull from a set of instructions based on conditions.

In Vue, the declarative APIs include `computed` and `watch` and other APIs like `watchEffect` that run by watching other values.

### Declarative Example

To implement `useFind` declaratively, we can use computed params, as shown here.  This example runs four requests based on a shared value. Suppose you have a set of tasks related to features which users can upvote.  Tasks have an `isCompleted` attribute, an `upvotes` count and a `dueDate` property.  Now let's suppose we're going to build a tasks dashboard. You want to see various types of task lists all based on a chosen date. So let's pretend that these are our requirements:

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
const paramsLeastUpvoted = computed(() => ({ 
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
    $limit: 20,
  },
  paginateOnServer: true
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
  paginateOnServer: true
}))
const { data: incompleteTasks } = taskStore.useFind(paramsIncomplete)
```

In the above scenario, we can bind to the task lists in the template and display the four reports.  Now, what code do we need to write to show data for a different date?  Let's see what a handler looks like when we have written declarative code.

### Declarative Handler

With declarative code, we only need to change the `date` variable.  The computed properties will tell `useFind` to fetch new data, automagically. There's no need to manually fetch. When the data returns, the lists will update on their own. As long as your template is rendering correctly, there's no more work to do.

```ts
// A handler to change the date from the UI
const setDate = (newDate) => {
  date.value = newDate
}
```

### Imperative Example

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
const paramsLeastUpvoted = reactive({ 
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
    $limit: 20,
  },
  paginateOnServer: true
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
  paginateOnServer: true
})
const { data: incompleteTasks, find: findIncomplete } = taskStore.useFind(paramsIncomplete)
```

### Imperative Handler

What does a handler look like for an imperative-minded example of our test scenario?  Let's take a look.  First, we have to update each set of params, since they can't automatically compute themselves (that's what `computed` properties are for). Then we have to manually tell `useFind` to request the new data.

```ts
// A handler to change the date for each query
const setDate = (newDate) => {
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

Look how much longer the imperative code is!  We had to manually tell `useFind` to update the date in each set of params. Then we had to manually command each one to fetch the new data.  With declarative-minded code, we can change the `date` as the source of truth. When it receives a `computed` property, `useFind` knows to re-fetch when changes occur.

So is it better to write declarative code? The answer is "maybe". It often makes the most sense to write declarative code, but some situations will work better with imperative code.  When writing in Vue, sometimes declarative code will lead to infinite loops. If you have three computed variables that watch each other, they will run forever. This code would create a loop (actually the code probably wouldn't run because `c` is being used before it's declared, but let's pretend it can run):

```ts
const a = computed(() => c.value + 1)
const b = computed(() => a.value + 1)
const c = computed(() => b.value + 1)
```

Can you see the loop?  

- When `c` updates, `a` will notice and increase its value by 1.
- When `a` increases its value, `b` will notice and increase its value by 1.
- When `b` increases its value, `c` will notice and increase its value by 1, which then re-triggers `a`.

The loop will go on until the allocated space for tracking current operations is too full, also known as a "stack overflow".

Declarative queries can work exactly the same way. When queries re-run based on other data and that logic goes in a loop, you'll end up with an asynchronous stack of requests. In order to fix the problem, you can switch one of them to imperative to break the automated flow.

<BlockQuote>

In the above scenario, if you use the `feathers-batch` plugins on the client and server, it will automatically group all queries into a single request.  They don't even have to be to the same service, only to the same server. It will really speed up your API.

</BlockQuote>

## Examples
