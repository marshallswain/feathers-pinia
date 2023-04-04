---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# associateGet

[[toc]]

The `associateGet` utility allows you to define `one-to-one` relationships on your Model functions. The `getId` property
allows you to specify the id to use to get the related data.

```ts
import type { Messages } from 'my-feathers-api'
import { type ModelInstance, useInstanceDefaults, associateGet } from 'feathers-pinia'
import { User } from './user'

const modelFn = (data: ModelInstance<Messages>) => {
  const withDefaults = useInstanceDefaults({ text: '', userId: null }, data)
  const withUser = associateFind(withDefaults, 'user', {
    Model: User,
    getId: (data) => data.messageId
  })
  return withUser
}
```

## associateGet(data, prop, options)

- `data {Object}` is the record that will contain the association.
- `prop {string}` is the name of the property that will hold the related data.
- `options {Object}`
  - `Model` is the Model Function for the related record. **Required**
  - `getId` is a function that receives the `data` and must return the related idField's value. **Required**
  - `makeParams` is an optional function that receives the `data` and must return a params object containing the `query` used to
  create the association. **Optional**
  - `handleSetInstance` is a function that receives the related object and can use it to update properties on `data` or
  the related object in order to establish a relationship when assigning data to the `prop`. **Optional** In the above
  example, if you assign an array of messages to `user.messages`, the message's `userId` prop will be set automatically.
