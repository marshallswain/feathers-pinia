
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
const { api } = useFeathers()

const dueDate = ref(new Date())

// 5 most-upvoted tasks for the day
const paramsMostUpvoted = computed(() => ({ 
  query: { 
    dueDate, 
    $sort: { upvotes: -1 },
    $limit: 5,
  },
  onServer: true
}))
const { data: mostUpvoted } = api.service('tasks').useFind(paramsMostUpvoted)

// 5 least-upvoted tasks for the day
const paramsLeastUpvoted = computed(() => ({ 
  query: { 
    dueDate, 
    $sort: { upvotes: 1 },
    $limit: 5,
  },
  onServer: true
}))
const { data: leastUpvotedTasks } = api.service('tasks').useFind(paramsLeastUpvoted)

// Twenty completed tasks for the day
const paramsComplete = computed(() => ({ 
  query: { 
    dueDate, 
    isCompleted: true,
    $limit: 20,
  },
  onServer: true
}))
const { data: completedTasks } = api.service('tasks').useFind(paramsComplete)

// Ten most-voted-for, incomplete tasks for the day
const paramsIncomplete = computed(() => ({ 
  query: { 
    dueDate, 
    isCompleted: false,
    $sort: { upvotes: -1 },
    $limit: 10,
  },
  onServer: true
}))
const { data: incompleteTasks } = api.service('tasks').useFind(paramsIncomplete)
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

To write the example as imperative-focused code, we can move the query to a `reactive` and manually update it. Now we
have more repetition. Notice how the same date is specified four times.

```ts
const { api } = useFeathers()

// 5 most-upvoted tasks for the day
const paramsMostUpvoted = reactive({ 
  query: { 
    dueDate: new Date(), 
    $sort: { upvotes: -1 },
    $limit: 5,
  },
  onServer: true
})
const { data: mostUpvoted, find: findMostUpvoted } = api.service('tasks').useFind(paramsMostUpvoted)

// 5 least-upvoted tasks for the day
const paramsLeastUpvoted = reactive({ 
  query: { 
    dueDate: new Date(), 
    $sort: { upvotes: 1 },
    $limit: 5,
  },
  onServer: true
})
const { data: leastUpvotedTasks, find: findLeastUpvoted } = api.service('tasks').useFind(paramsLeastUpvoted)

// Twenty completed tasks for the day
const paramsComplete = reactive({ 
  query: { 
    dueDate: new Date(), 
    isCompleted: true,
    $limit: 20,
  },
  onServer: true
})
const { data: completedTasks, find: findComplete } = api.service('tasks').useFind(paramsComplete)

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
const { data: incompleteTasks, find: findIncomplete } = api.service('tasks').useFind(paramsIncomplete)
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
