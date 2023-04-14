---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Hybrid Query Utilities

Learn about the easiest way to watch and query data with `service.useFind` and `service.useGet`.

[[toc]]

Hybrid queries combine API requests and store requests into a simpler API, so when the query or id changes, the queries
are automatically made and the correct data is pulled from the store for you.

There are a few scenarios where the hybrid query utilities really shine:

## useFind

The [useFind utility](./use-find) comes in handy when

- Paginating data with `$limit` and `$skip`. Feathers-style pagination support is built in and made simple.
- Performing server-side pagination with `useFind` and the `paginateOn` option set to `'server'`. Turning on
`paginateOn: 'server'` keeps track of individual pages of server data and re-fetches data whenever the list needs to change.
- Performing client-side pagination, where you pull a big set of data into the store then paginate through it at
lightning speed.

## useGet

The [useGet utility](./use-get) comes in handy when

- you want to pull individual records from the database, like to populate a form. It's especially useful when the
`skipGetIfExists` configuration option is enabled, which should be enabled on realtime applications, but probably not on
Rest applications.
