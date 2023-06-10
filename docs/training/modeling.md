---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Modeling Service Data

Learn why data modeling is so important and how Feathers-Pinia makes it simple.

[[toc]]

## What is Data Modeling?

Data modeling is a way of defining and managing resources. You can think of "resources" as the nouns that are stored in
our database tables: `users`, `messages`, `notifications`, etc. Each noun represents a shape of data which we define
using a schema.

Modeling doesn't only define the shape of our data. It becomes more useful when it considers business requirements and
defines actions that will operate on our data. Think of the "actions" as the verbs that act on our nouns. The Feathers
Service Interface defines built-in verbs: `find`, `get`, `create`, `patch`, and `remove`. You can also define custom
methods, which are basically additional verbs.

In addition to identifying resources and actions, we can identify relationships between our resources. All of this
information gives us a foundation for recognizing patterns across our data. The definition and implementation of those
patterns is called Data Modeling.

## Why Data Modeling?

The biggest reason to model data is to **write clean code**. Modeling helps keep our business logic decoupled from
component logic and template code. For example, many Vue developers define schemas inside component code. This severely
limits the portability and reusability of that component.

Modeling also allows us to **write far less code**. We can take advantage of common interfaces, use them as abstractions,
and build our components around the abstractions. The more we take advantage of interfaces, the more likely we can reuse
our components. Reusing components means you get to write fewer components.

Writing clean code and reusable, interface-driven code generally leads to improved maintainability, allowing us to stay
focused on writing features instead of refactoring old, dead code. Every line of code is both an asset and a liability.
If our code is clean, it trends toward being more of an asset that serves us instead of a liability that holds our
ideas, our businesses, and ourselves back from our full potential.

<BlockQuote label="The Power of Interfaces">

The Model Function API provides a common interface that abstracts away the underlying implementation. This is similar
to how FeathersJS database adapters work. FeathersJS supports many database adapters. By swapping out an adapter, the
same code that was previously running on one database now runs on some other database.

</BlockQuote>

## Modeling with Feathers-Pinia

Feathers-Pinia introduces the powerful modeling layer that's missing from most Vue applications. It makes it simple to
write cleaner code; our data structure can stay decoupled from our components. It also gifts us with the model instance
interface. The instance interface provides common methods for working with api-driven and stored data.

Feathers-Pinia 3.0 no longer requires you to define your models. By using the service as the model, we can use the
service path as the model name/type. Every record is automatically turned into a Feathers instance, so we're only
required to define custom functionality that's specific to our application.

Feathers-Pinia also allows us to work with non-service and service data using the same API. You can use
[data stores](/data-stores/) to create modeling stores. The consistent interface keeps the mental overhead low
and our productivity goes way up!

### Instance Interfaces

There are two instance interfaces built into Feathers-Pinia.

- The [ModelInstance API](/data-stores/instances) is added to all records in the standalone data stores.
- The [ServiceInstance API](/services/instances) is added to all records in the service stores and API methods.

### useInstanceDefaults

```ts
useInstanceDefaults(defaults, data)
```

The `useInstanceDefaults` utility allows you to specify default values to assign to new instances. It
only assigns a value if it the attribute not already specified on the incoming object.

```ts
import type { Users, UsersData, UsersQuery } from 'my-feathers-api'
import { type ModelInstance, useFeathersModel, useInstanceDefaults } from 'feathers-pinia'
import { api } from '../feathers'

const service = api.service('users')

const modelFn = (data: ModelInstance<Users>) => {
  const withDefaults = useInstanceDefaults({ name: '', email: '', password: '' }, data)
  return withDefaults
}
const User = useFeathersModel<Users, UsersData, UsersQuery, typeof modelFn>(
  { name: 'User', idField: '_id', service },
  modelFn,
)
```

Now when you create a `User` the object will have default values applied:

<BlockQuote label="note" type="warning">

Any key that exists on the incoming data will not be replaced by a default value, even if the value of that key is
`undefined`.

</BlockQuote>

```ts
// if no properties are passed, the defaults will all apply
const user = User({})
console.log(user) // --> { name: 'Marshall', email: '', password: '' }

// If partial keys are passed, non-passed keys will have defaults applied.
const user = User({ name: 'Marshall' })
console.log(user) // --> { name: 'Marshall', email: '', password: '' }

// any "own property" that's present on the object will not be replaced by a default value, even `undefined` values.
const user = User({ name: undefined })
console.log(user) // --> { name: undefined, email: '', password: '' }
```

### Modeling Associations

- associateFind creates one-to-many associations based on a FeathersJS query.
- associateGet create one-to-one associations based on an id.
