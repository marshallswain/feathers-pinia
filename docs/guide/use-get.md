---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# The `useFind` Utility

[[toc]]

## Overview of Features

## API

### useGet(id, params)

- **`id` {MaybeRef string | number}**
- **`params` {Object}**
  - **`query` {Object}** a Feathers query object.
  - **`store` {Store}**
  - **`onServer` {boolean}**
  - **`immediate` {Store}**

### Returned Object

  - **`id` {Ref number | string}**
  - **`params` {Params}**
  - **`store` {Store}**
  - **`data` {Computed Array}**
  - **`ids` {Ref Array}**
  - **`getFromStore` {Function}**
  - **`isPending` {Computed boolean}**
  - **`hasBeenRequested` {Computed boolean}**
  - **`hasLoaded` {Computed boolean}**
  - **`error` {Computed error}**
  - **`clearError` {Function}**
  
### Examples