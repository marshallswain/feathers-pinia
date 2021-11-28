# Auth Stores

## Setup

Let's start with the most basic example of authentication. We'll use `defineAuthStore` utility and pass our client to the options object. This is the only required option, we'll go through the rest in the later part of the chapter.

```ts
// store/auth.ts
import { defineAuthStore } from 'feathers-pinia'
import { api as feathersClient } from '~/feathers'

export const useAuth = defineAuthStore({
  feathersClient,
})
```

At this point we're already set. What's left is to authenticate our user. Depending on a strategy, it can look like that:

```ts
import { useAuth } from '~/store/auth'

const auth = useAuth()
auth.authenticate({
  strategy: 'local',
  email: 'meow@meow.cat',
  password: 'purr',
})
```

A difference between FeathersPinia and FeathersVuex is that FeathersPinia doesn't provide a reactive user object out of the box. This way it's easier for us to customize the intended behavior by passing a handler action into our auth store.

Let's take a look at the example:

```ts
import { defineAuthStore } from 'feathers-pinia'
import { api as feathersClient } from '~/feathers'
import { User } from './users.ts'

const authStore = defineAuthStore({
  feathersClient,
  state() {
    return { userId: null }
  },
  getters: {
    user() {
      return this.userId ? User.getFromStore(this.userId) : null
    },
  },
  actions: {
    handleResponse(response: any) {
      this.userId = response.user.id || response.user._id
      User.addToStore(response.user)
      return response
    },
  },
})
```

Notice that we're using `User` model class this time. This will require us to call the user service before we use the auth service, so that the `User` class is actually instantiated and available.

In Vuex this was done automatically in the root Vuex module. Pinia is a more decentralized store, so we're responsible for that ourselves.

```ts
import { useUsers } from '~/store/users'
import { useAuth } from '~/store/auth'

const users = useUsers()
const auth = useAuth()
auth.authenticate()
```

## Using `defineAuthStore`

The `defineAuthStore` utility accepts an option objects according to specification in the interface below:

```ts
interface SetupAuthOptions {
  feathersClient: any
  id?: string
  state?: Function
  getters?: { [k: string]: any }
  actions?: { [k: string]: any }
}
```

Here are a few more details about each option:

- **`feathersClient`** is the Feathers client we want to authenticate. This is the only **_required_** option.
- **`id {String}`** is the identifier of the Pinia store. By default it's set to `auth`.
- **`state {Function}`** provides custom state properties you want to use in the auth store.
- **`getters {Object}`** provides custom getters. The most common use case is to return the current user from the User store.
- **`actions {Object}`** is an object of custom actions. Most commonly used to customize the response handler.

## Auth store API

### State

By default, the auth store state provides us with the following properties:

- **`isAuthenticated {Boolean}`** is set after a successful `authenticate` action. Defaults to `false`.
- **`isLoading {Boolean}`** is set at the start of `authenticate` action and turn back to `false` once we know its result. It defaults to `true`.
- **`accessToken {String}`** contains the token, coming either from auth0 service or our API. Defaults to `null`.
- **`payload {Object}`** is the content of response from the `authenticate` action. Defaults to `null`.
- **`error {Object}`** is the error object provided in case of failed authentication. Defaults to `null`. This is how the default error handler behaves, we can change it by writing custom handler action.

### Getters

The only default getter is `feathersClient`, returning the client that we previously passed to it. Feel free to add more getters the same way as in our example above.

### Actions

There are three default actions that we care about:

- **`authenticate`** - sends an authentication request. A successful action should give us the `accessToken` and set the `isAuthenticated` flag. In case of failure, it should provide `error`. We can track the action's status thanks to `isLoading` flag.

- **`handleResponse`** - a default callback for successfully called `authenticate` action. Out of the box, it only returns the `response` object. Make sure to keep this behavior if you later want add a callback directly to the `authenticate` action call.

- **`handleError`** - a default callback for failed authentication. Out of the box, it only passes the `error` object to adequate state property. Overwrite it if you want to customize this.
