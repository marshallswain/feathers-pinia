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

First, get the `app` instance from `context`. Then lookup a service and use its methods:

```ts

async (context: HookContext, next: NextFunction) => {
  const { app } = context
  // use service methods
  app.service('messages').findInStore()

  // directly read from the store
  app.service('messages').store.items

  await next()
}
```

## Handle Custom Methods

See the FeathersJS documentation for to to use [custom methods](https://feathersjs.com/api/services.html#custom-methods).

To handle the response from a custom method, create a [custom Pinia store](#custom-pinia-stores).

## Custom Pinia Stores

Instead of customizing stores, a more flexible solution is provided by Pinia: Store Composition. Here's an example of
how to create a feature store that references a Feathers-Pinia v3 store.

```ts
export const useFeatureStore = defineStore('my-feature-store', () => {
  const { api } = useFeathers()

  const usersNamedFred = computed(() => {
    return api.service('users').findInStore({ query: { name: 'Fred' } }).data.value
  })
  
  return { usersNamedFred }
})
```

You can use any of the Feathers-Pinia service methods in composed stores. Read more about [Pinia Store Composition](https://pinia.vuejs.org/cookbook/composing-stores.html)

## Reactive Lists with Live Queries

Using Live Queries greatly simplifies app development.  The `find` getter enables this feature.  Here is how you might
setup a component to take advantage of Live Queries.  The next example shows how to setup two live-query lists using two
getters.

```ts
// fetch past and future appointments
const params = computed(() => {
  return { query: {} }
})
const { isPending, find } = api.service('appointments').useFind(params)

// future appointments
const futureParams = computed(() => {
  return { query: { date: { $gt: new Date() } } }
})
const { data: futureAppointments } = api.service('appointments').useFind(futureParams)

// past appointments
const pastParams = computed(() => {
  return { query: { date: { $lt: new Date() } } }
})
const { data: pastAppointments } = api.service('appointments').useFind(pastParams)
```

in the above example of component code, the `future` and `pastAppointments` will automatically update as more data is
fetched using the `find` utility.  New items will show up in one of the lists, automatically.  `feathers-pinia` listens
to socket events automatically, so you don't have to manually wire any of this up!

## Query Once Per Record

The simplest way to only query once per record is to set the `skipGetIfExists` option to `true` during configuration.

You can also use the `useFindOnce` method to achieve the same behavior for individual requests.

## Clearing Data on Logout

The best solution is to simply refresh to clear memory.  If you're using localStorage, clear the localStorage, then
call `window.location.reload()`. The alternative to refreshing would be to perform manual cleanup of the service stores.
Refreshing is much simpler and more practical, so it's the official solution.

## Data-Level Computed Props

You can define model-level computed properties by using `Object.defineProperty` to create a non-enumerable,
configurable, ES5 getter. Note that when you use `defineProperty`, you have to manually specify a union type. The line
`return withDefaults as typeof withDefaults & { fullName: string }` lets TypeScript know that the `fullName` property
exists.

```ts
import type { Users, UsersData, UsersQuery } from 'my-feathers-api'

const setupInstance (data: Users) {
  const withDefaults = useInstanceDefaults({ firstName: '', lastName: '' }, data)

  // Define a non-enumerable, configurable property
  Object.defineProperty(withDefaults, 'fullName', {
    enumerable: false,
    configurable: true,
    get() {
      return `${this.firstName} ${this.lastName}`
    }
  })
  return withDefaults as typeof withDefaults & { fullName: string }
}
```

### Relationships Between Services

Use `Object.defineProperties` to create relationships in the `setupInstnace` method of each service.

### Mutation Multiplicity Pattern

The Mutation Multiplicity (anti) Pattern is a side effect of strict mode in stores. Vuex strict mode would throw errors
when editing data in the store. Thankfully, Pinia will not throw errors when you modify store data. However, it's
considered an anti-pattern to modify store data directly. The one exception is that cloned records are considered safe
to edit in Feathers-Pinia, despite being kept in the store.  The most common (anti)pattern that beginners use to work
around the "limitation" of not being able to edit store data is to

1. Read data from the store and use it for display in the UI.
2. Create custom actions/mutations intended to modify the data in specific ways.
3. Use the actions/mutations wherever they apply (usually implemented as one mutation per form).

There are times when defining custom mutations is the most supportive pattern for the task, but consider them to be more
rare.  The above pattern can result in a huge number of mutations, extra lines of code, and increased long-term
maintenance costs.

The solution to the Mutation Multiplicity Malfeasance is the Clone and Commit Pattern in Feathers-Pinia.

### Clone and Commit Pattern

The "Clone and Commit" pattern provides an alternative to using a lot of actions/mutations. This patterns looks more
like this:

1. Read data from the store and use it for display in the UI.  (Same as above)
2. Create and modify a clone of the data.
3. Use a single mutation to commit the changes back to the original record in the store.

Sending most edits through a single mutation can really simplify the way you work with store data.  The `BaseModel`
class has `clone` and `commit` instance methods. These methods provide a clean API for working with items in the store
and not unsafely editing data:

```ts
const task = api.service('tasks').new({
  description: 'Plant the garden',
  isComplete: false
})

const clone = task.clone()
clone.description = 'Plant half of the garden."
clone.commit()
```

In the example above, modifying the `task` variable would unsafely modify stored data, which is a generally unsupportive
practice when not done consciously. Calling `task.clone()` returns a reactive clone of the instance.  It's safe to
change clones. You can then call `clone.commit()` to update the original record in the store.

## Feathers Client

This section reviews how to create and use Feathers Clients

### Multiple Feathers Clients

For additional Feathers APIs, export another Feathers client instance with a unique variable name (other than `api`).

Here's an example that exports a couple of **feathers-rest** clients:

```ts
// src/feathers.ts
import { feathers } from '@feathersjs/feathers'
import rest from '@feathersjs/rest-client'
import auth from '@feathersjs/authentication-client'

const fetch = window.fetch.bind(window)

// The variable name of each client becomes the alias for its server.
export const api = feathers()
  .configure(rest('http://localhost:3030').fetch(fetch))
  .configure(auth())

export const analytics = feathers()
  .configure(rest('http://localhost:3031').fetch(fetch))
  .configure(auth())
```

### SSG-Compatible localStorage

When doing Static Site Generation (SSG), the server doesn't usually have access to the `window` object, which is a
browser global. Trying to access a non-existent `window` variable will throw an error on the server. The easiest way to
get around this issue is with [useStorage](https://vueuse.org/core/usestorage/) from the [@vueuse/core package](https://vueuse.org/).

```ts{2,9-18}
import { createClient } from 'feathers-pinia-api'
import { useStorage } from '@vueuse/core'
import socketio from '@feathersjs/socketio-client'
import io from 'socket.io-client'

const host = import.meta.env.VITE_MYAPP_API_URL as string || 'http://localhost:3030'
const socket = io(host, { transports: ['websocket'] })

// setup SSG-compatible authentication storage
const storageKey = 'feathers-jwt'
const jwt = useStorage(storageKey, '')
const storage = {
  getItem: () => jwt.value,
  setItem: (key: string, val: string) => (jwt.value = val),
  removeItem: () => (jwt.value = null),
}

export const api = createClient(socketio(socket), { storage })
```

### Server-Compatible Fetch

For a fetch adapter that's compatible with Static Site Generation (SSG) and Server-Side Rendering (SSR), check out the
[OFetch](/guide/ofetch) page.

### Access Feathers Client

While it's possible to manually import the Feathers Client using the module system, like this:

```ts
import { api } from '../feathers'
```

Thanks to [Auto-Imports](/guide/auto-imports), we can decouple from the module path, completely, and define our own composable
function that returns an object which contains our app's Feathers Client instances:

```ts
// src/composables/use-feathers.ts
import { api } from '../feathers'

export const useFeathers = () => {
  return { api }
}
```

And now in our composables and components, we can access the Feathers Client by calling our composable function, no need
to import it, first (assuming you're using auto-imports as shown in the setup guides).  Here's what it looks like:

```ts
const { api } = useFeathers()
```

## Avoid npm Install Errors

If you're using npm to install packages and keep getting errors about `vue-demi` and `peerDependencies`, you can silence
these errors by creating an `.npmrc` file in the root of your project with the following contents:

```txt
shamefully-hoist=true
strict-peer-dependencies=false
legacy-peer-deps=true
```
