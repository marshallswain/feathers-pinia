---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Common Patterns

[[toc]]

## Accessing a Store From Hooks

When setting up a service, it's recommended that you declare hooks for the service next to the store. As per the Pinia docs, since we're using the store outside of a component context, the original `pinia` instance will need to be provided when calling `useUsers`, as shown here:

```ts
// src/store/users.ts
import type { HookContext, NextFunction } from '@feathersjs/feathers'
import { defineStore, BaseModel, pinia } from './store.pinia'
import { api } from '../feathers'

// create a data model
export class User extends BaseModel {
  id?: number | string
  name: string = ''
  email: string = ''
  password: string = ''

  // Minimum required constructor
  constructor(data: Partial<User> = {}, options: Record<string, any> = {}) {
    super(data, options)
    this.init(data)
  }

  // optional for setting up data objects and/or associations
  static setupInstance(message: Partial<Message>) {
    const { store, models } = this
  }
}

const servicePath = 'users'
export const useUsers = defineStore({ servicePath, Model: User })

api.service(servicePath).hooks({
  around: {
    find: [
      async (context: HookContext, next: NextFunction) => {
        const userStore = useUsers(pinia)

        // Do something with the store before sending the request or...

        await next()

        // Do something with the store after the response comes back.
      }
    ]
  }
})
```

## Handle Custom Server Response

Sometimes your server response may contain more attributes than just `data`, `limit`, `skip`, and `sort`.  Maybe your API response include a `summary` field, and you need access to that. You could process this directly in a component, if it's only needed in that one component,  But, if you need it in multiple components, there are better options.

Depending on what you need to do, you may be able to solve this by [accessing the store from hooks](#accessing-a-store-from-hooks).  But that doesn't work if you need reactive data from the store.

To get the data into the store, you can use the [`afterFind` action](./service-stores#afterfindresponse).  Here's what it looks like:

```js
import { defineStore, BaseModel } from '../pinia'

class SpeedingTicket extends BaseModel {
  vin = ''
  plateState = ''

  constructor(data: Partial<SpeedingTicket> = {}) {
    super(data, options)
    this.init(data)
  }
}

const servicePath = 'speeding-tickets'
export const useSpeedingTickets = defineStore({
  servicePath,
  Model: SpeedingTicket,
  actions: {
    afterFind (response: any) {
      if (response.summary) {
        this.handleSummary(response)
      }
    },
    handleSummaryData(response: any) {
      // Handle summary data
    }
  },
})
```

## Reactive Lists with Live Queries

Using Live Queries greatly simplifies app development.  The `find` getter enables this feature.  Here is how you might setup a component to take advantage of Live Queries.  The next example shows how to setup two live-query lists using two getters.

```ts
import { useAppointments } from '../stores/appointments'

const appointmentStore = useAppointments()

// fetch past and future appointments
const params = reactive({ query: {} } })
const { isPending, find } = appointmentStore.useFind(params)

// future appointments
const futureParams = reactive({ query: { date: { $gt: new Date() } } })
const { data: futureAppointments } = appointmentStore.useFind(futureParams)

// past appointments
const pastParams = reactive({ query: { date: { $lt: new Date() } } })
const { data: pastAppointments } = appointmentStore.useFind(pastParams)
```

in the above example of component code, the `future` and `pastAppointments` will automatically update as more data is fetched using the `find` utility.  New items will show up in one of the lists, automatically.  `feathers-pinia` listens to socket events automatically, so you don't have to manually wire any of this up!

## Manually-Query Once Per Record

<BlockQuote>

See the next example for a new short-hand syntax to implement this same pattern with `store.useGetOnce`.

</BlockQuote>

For real-time apps, it's not necessary to retrieve a single record more than once, since feathers-pinia will automatically keep the record up to date with real-time events. You can use `queryWhen` to make sure you only retrieve a record once. Perform the following steps to accomplish this:

1. Pass `immediate: false` in the params to prevent the initial request.
2. Pass a function that returns a boolean to `queryWhen`. In this example, we return `!user.value` because we should query when we don't already have a user record.
3. Manually call `get`, which will only trigger an API request if we don't have the record. Woot!

```ts
import { useUsers } from '../store/users'

interface Props {
  id: string | number
}
const props = defineProps<Props>()
const userStore = useUsers()

const { data: user, queryWhen, get } = userStore.useGet(props.id, { 
  onServer: true, 
  immediate: false            // (1)
})
queryWhen(() => !user.value)  // (2)
await get()                   // (3)
```

The above example also shows why `queryWhen` is no longer passed as an argument. It's most common that `queryWhen` needs values returned by `useGet`, but those values aren't available until after `useGet` runs, making them unavailable to `queryWhen` as an argument. In short, moving `queryWhen` to the returned object gives us access to everything we need to productively prevent queries.

## Auto-Query Once Per Record

The previous pattern of only querying once is so common for real-time apps that we've built a shortcut for it at `store.useGetOnce`. It uses the same code as above, but built into the store method.

```ts
import { useUsers } from '../store/users'

interface Props {
  id: string | number
}
const props = defineProps<Props>()
const userStore = useUsers()

const { data: user } = userStore.useGetOnce(props.id)
```

Now the same record will only be retrieved once.

## Clearing Data on Logout

The best solution is to simply refresh to clear memory.  If you're using localStorage, clear the localStorage, then refresh. The alternative to refreshing would be to perform manual cleanup of the service stores. Refreshing is much simpler and more practical, so it's the official solution.

## Server-Side Rendering (SSR)

See the SSR example on the [Getting Started](./setup.md#server-side-rendering-ssr) page.

## Directly Using Action Results

Actions return reactive store records.

## Handling Non-Reactive Data

https://vuex.feathersjs.com/common-patterns.html#handling-non-reactive-data


## Model-Level Computed Props

https://vuex.feathersjs.com/common-patterns.html#model-specific-computed-properties

## Relationships Between Services

See the [Model Associations](./model-associations.md) page.

## Working with Forms

### Mutation Multiplicity Pattern

The Mutation Multiplicity (anti) Pattern is a side effect of strict mode in stores. Vuex strict mode would throw errors when editing data in the store. Thankfully, Pinia will not throw errors when you modify store data. However, it's considered an anti-pattern to modify store data directly. The one exception is that cloned records are considered safe to edit in Feathers-Pinia, despite being kept in the store.  The most common (anti)pattern that beginners use to work around the "limitation" of not being able to edit store data is to

1. Read data from the store and use it for display in the UI.
2. Create custom actions/mutations intended to modify the data in specific ways.
3. Use the actions/mutations wherever they apply (usually implemented as one mutation per form).

There are times when defining custom mutations is the most supportive pattern for the task, but consider them to be more rare.  The above pattern can result in a huge number of mutations, extra lines of code, and increased long-term maintenance costs.

The solution to the Mutation Multiplicity Malfeasance is the Clone and Commit Pattern in Feathers-Pinia.

### Clone and Commit Pattern

The "Clone and Commit" pattern provides an alternative to using a lot of actions/mutations. This patterns looks more like this:

1. Read data from the store and use it for display in the UI.  (Same as above)
2. Create and modify a clone of the data.
3. Use a single mutation to commit the changes back to the original record in the store.

Sending most edits through a single mutation can really simplify the way you work with store data.  The `BaseModel` class has `clone` and `commit` instance methods. These methods provide a clean API for working with items in the store and not unsafely editing data:

```ts
import { useTodos } from '../stores/todos'

const todoStore = useTodos()

const todo = new todoStore.Model({
  description: 'Plant the garden',
  isComplete: false
})

const clone = todo.clone()
clone.description = 'Plant half of the garden."
clone.commit()
```

In the example above, modifying the `todo` variable would unsafely modify stored data, which is a generally unsupportive practice when not done consciously. Calling `todo.clone()` returns a reactive clone of the instance.  It's safe to change clones. You can then call `clone.commit()` to update the original record in the store.

The `clone` and `commit` methods are used by [useClone and useClones](./use-clones.md).