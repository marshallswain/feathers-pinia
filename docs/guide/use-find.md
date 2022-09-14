---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
</script>

# The `useFind` Utility

[[toc]]

## Overview of Features

In version 1.0, the `useFind` utility has been completely rewritten from scratch.  It is a workflow-driven utility, which makes it a pleasure to use. Here's an overview of its features:

- **Intelligent Fall-Through Caching** - Like SWR, but way smarter.
- **Client-Side Pagination** - Built in, sharing the same logic with `usePagination`.
- **Server-Side Pagination** - Also built in.
- **Infinite Pagination Support** - Bind to `allData` and tell it when to load more data.

<BlockQuote>

To lighten the burden of migrating with this breaking change, the old `useFind` utility is now provided as [`useFindWatched`](./use-find-watched).

</BlockQuote>

## API

### `useFind(params)`

### Returned Utilities

## Examples
