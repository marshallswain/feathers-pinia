---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Module Overview

[[toc]]

## Setup & Store Creation

These are the primary utilities for creating stores.

```ts
// Setup & Store Creation
export { createPiniaClient } from './create-pinia-client'
export { OFetch } from './feathers-ofetch'
export { useInstanceDefaults } from './utils'
```

- [createPiniaClient](/guide/use-data-store) wraps the Feathers Client in a Feathers-Pinia client.
- [OFetch](/guide/ofetch) is a special fetch adapter for SSR applications.
