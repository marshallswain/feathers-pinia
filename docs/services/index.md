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

## The "new" Method

```ts
service.new(data)
```

The "new" method allows creation of model instances. It takes the place of calling `new Model(data)` in previous
Feathers-Pinia releases.

### Customizing Instances

Customizing the default state of each instance is done through `setupInstance` in each service's configuration.

## Service Methods

Service methods are convenience wrappers around the Feathers Client service provided in the options.

### `find(params)`

```ts
await todoStore.find({ query: {} })
```

Uses the Feathers Client to retrieve records from the API server. On an SSR server, find data will be marked as `ssr: true`, which allows extra queries to be skipped on the client.

### `findOne(params)`

```ts
await service.findOne({ query: {} })
```

Uses the Feathers Client to retrieve the first matching record from the API server. On an SSR server, find data will be
marked as `ssr: true`, which allows extra queries to be skipped on the client.

### `count(params)`

```ts
await service.count({ query: { isComplete: false } })
```

Like `find`, but returns the number of records that match the query. It does not return the actual records.

### `get(id, params)`

```ts
await todoStore.get(1)
```

Uses the Feathers Client to retrieve a single record from the API server.

Uses the Feathers Client to send an `update` request to the API server.

### `patch(id, data, params)`

```ts
await todoStore.patch(1, { isComplete: true })
```

Uses the Feathers Client to send an `patch` request to the API server.

### `remove(id, params)`

```ts
await api.service.remove(id)
```

Uses the Feathers Client to send a `remove` request to the API server.

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
