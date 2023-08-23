---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Define Default Values

Learn how to setup default values on new instances with `useInstanceDefaults`.

## useInstanceDefaults

```ts
useInstanceDefaults(defaults, data)
```

The `useInstanceDefaults` utility allows you to specify default values to assign to new instances. It
only assigns a value if it the attribute not already specified on the incoming object.

```ts
function setupInstance(data: any) {
  const withDefaults = useInstanceDefaults({ name: '', email: '', password: '' }, data)
  return withDefaults
}
```

Now when you create a user, the object will have default values applied:

<BlockQuote label="note" type="warning">

Existing keys in `data` will not be replaced by a default value, even if that value is `undefined`.

</BlockQuote>

```ts
// if no properties are passed, the defaults will all apply
const user = api.service('users').new({})
console.log(user) // --> { name: 'Marshall', email: '', password: '' }

// If partial keys are passed, non-passed keys will have defaults applied.
const user = api.service('users').new({ name: 'Marshall' })
console.log(user) // --> { name: 'Marshall', email: '', password: '' }

// any "own property" that's present on the object will not be replaced by a default value, even `undefined` values.
const user = api.service('users').new({ name: undefined })
console.log(user) // --> { name: undefined, email: '', password: '' }
```
