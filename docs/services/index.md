---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Feathers-Pinia Services

[[toc]]

## Service Interface Overview

The Feathers-Pinia Service Interface adds methods to the [Feathers Service Interface](https://feathersjs.com/api/services.html),
allowing the service to work as a functional replacement for a Model constructor. In short, in Feathers-Pinia v3 the
service is the Model.

Here's an overview of the full Feathers-Pinia Service Interface:

<!--@include: ../partials/service-interface.md-->

Learn more about the service methods:

- [The "new" Method](#the-new-method)
- [API Methods](#api-methods)
- [Store Methods](#store-methods)
- [Hybrid Methods](#hybrid-methods)
- [Event Methods](#event-methods)

## The "new" Method

The "new" method allows creation of model instances. It takes the place of calling `new Model(data)` in previous
Feathers-Pinia releases.

[[toc]]

### Creating Instances

### Customizing Instances

#### Instance Defaults

## Service Methods

Service methods are convenience wrappers around the Feathers Client service provided in the options.

### `find(params)`

Uses the Feathers Client to retrieve records from the API server. On an SSR server, find data will be marked as `ssr: true`, which allows extra queries to be skipped on the client.

```ts
todoStore.find({ query: {} }).then(/* ... */)
```

### `findOne(params)`

Uses the Feathers Client to retrieve the first matching record from the API server. On an SSR server, find data will be
marked as `ssr: true`, which allows extra queries to be skipped on the client.

```ts
service.findOne({ query: {} }).then(/* ... */)
```

### `count(params)`

Like `find`, but returns the number of records that match the query. It does not return the actual records.

```vue
<script setup lang="ts">
import { useTodos } from '../store/todos'
const todoStore = useTodos()

await todoStore.count({ query: { isComplete: false } })
</script>
```

### `get(id, params)`

Uses the Feathers Client to retrieve a single record from the API server.

```vue
<script setup lang="ts">
import { useTodos } from '../store/todos'
const todoStore = useTodos()

await todoStore.get(1)
</script>
```

### `update(id, data, params)`

Uses the Feathers Client to send an `update` request to the API server.

```vue
<script setup lang="ts">
import { useTodos } from '../store/todos'
const todoStore = useTodos()

await todoStore.update(1, { description: 'foo', isComplete: true })
</script>
```

### `patch(id, data, params)`

Uses the Feathers Client to send an `patch` request to the API server.

```vue
<script setup lang="ts">
import { useTodos } from '../store/todos'
const todoStore = useTodos()

await todoStore.patch(1, { isComplete: true })
</script>
```

### `remove(id, params)`

Uses the Feathers Client to send a `remove` request to the API server.

```vue
<script setup lang="ts">
import { useTodos } from '../store/todos'
const todoStore = useTodos()

await todoStore.remove(1)
</script>
```

### Service Utils

These utilities use a combination of multiple store methods to eliminate boilerplate and improve developer experience.

- [useFind()](/services/use-find)
- [useGet()](/services/use-get)
- `useGetOnce()` has the same API as [useGet](/services/use-get), but only queries once per record.

## Service Events

Services are `EventEmitter` instances which emit service events when received. Services can be used as a data-layer
Event Bus. You can even use custom event names:

```js
service.on('custom-event', (data) => {
  console.log(data) // { test: true }
})

service.emit('custom-event', { test: true })
```

### service.on

Register event handlers to listen to events.

### service.once

Register an event handler that only occurs once.

### service.removeListener

Remove an event handler.
