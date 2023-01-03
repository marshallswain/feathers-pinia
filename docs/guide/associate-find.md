---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import pkg from '../../package.json'
import BlockQuote from '../components/BlockQuote.vue'
</script>

<div style="position: fixed; z-index: 1000; top: 2px; right: 2px;">
  <Badge :label="`v${pkg.version}`" />
</div>

# associateFind

[[toc]]

The `associateFind` utility uses the Feathers Query syntax to establish one-to-many relationships with associated data.

```ts
import type { Users } from 'my-feathers-api'
import { type ModelInstance, useInstanceDefaults, associateFind } from 'feathers-pinia'
import { Message } from './message'

const modelFn = (data: ModelInstance<Users>) => {
  const withDefaults = useInstanceDefaults({ email: '', password: '' }, data)
  const withMessages = associateFind(withDefaults, 'messages', {
    Model: Message,
    makeParams: (data) => ({ query: { userId: data.id } }),
    handleSetInstance(message) {
      message.userId = data.id
    },
  })
  return withMessages
}
```

## associateFind(data, prop, options)

- `data {Object}` is the record that will contain the association.
- `prop {string}` is the name of the property that will hold the related data.
- `options {Object}`
  - `Model` is the Model Function for the related record. **Required**
  - `makeParams` is a function that receives the `data` and must return a params object containing the `query` used to
  create the association. **Required**
  - `handleSetInstance` is a function that receives the related object and can use it to update properties on `data` or
  the related object in order to establish a relationship when assigning data to the `prop`. **Optional** In the above
  example, if you assign an array of messages to `user.messages`, the message's `userId` prop will be set automatically.
