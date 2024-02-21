---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Common Pitfalls

If you run into issues, check here for solutions, first.

[[toc]]

## Reactivity Issues

The following sections cover common issues with reactivity.

### Query Syntax Errors

Both the `useFind` and `findInStore` methods accept a params object as their first argument. If you forget to place your
query parameters under the `query` key, you'll get all results back.  Make sure your query is properly formed:

```ts
// correctly uses the `query` key
const params = computed(() => ({ query: { name: 'Fred' } }))
```

```ts
// incorrectly omits the `query` key
const params = computed(() => ({ name: 'Fred' }))

// the above query is the same as providing an empty query
// which returns all results
const params = computed(() => ({ query: {} }))
```

Be sure to use the `query` key to properly filter your results.

### Non-Reactive Query Params

If you're directly passing a plain params object, the `findInStore` results will not be reactive. If matching data
exists in the store at the moment the query is made, results will be returned, but they will not be reactive. If there's
no matching data in the store, the results will be empty and stay that way.

```ts
// not reactive
const $route = useRoute()
const params = { query: { name: $route.params.name } }
const result = api.service('users').findInStore(params)
```

Wrap your params in a computed property to make them reactive:

```ts
// computed params are reactive
import { computed } from 'vue'

const $route = useRoute()
const query = computed(() => ({ query: { name: $route.params.name } }))
const result = api.service('users').findInStore(query)
```

### Destructuring Without `toRefs`

Destructuring the object returned from `useFind` or `findInStore` will break reactivity. This is because the returned
object is a Vue `reactive` object, which is not reactive when destructured:

```ts
// incorrectly destructures the reactive object
const { data, limit, skip, total } = api.service('message').findInStore()
```

There are two solutions:

1. Use the returned object directly.
2. Use `toRefs` to make the destructured object reactive.

### Use the Returned Object Directly

Keeping the reactive intact will preserve its reactive nature:

```ts
const messages$ = api.service('message').findInStore(params)
```

### Enable Reactivity with `toRefs`

The [toRefs](https://vueuse.org/shared/toRefs/#torefs) utility from VueUse is similar to the one built into Vue, but
works in more scenarios. It can be used to make the destructured object reactive:

```ts
import { toRefs } from '@vueuse/core'

const { data: messages, limit, skip, total } = toRefs(api.service('message').findInStore())

// access reactive properties with `.value`
console.log(messages.value)
```

Keep in mind that you'll now need to use `.value` to access the reactive properties, as shown in the previous example.

## Avoid npm Install Errors

If you're using npm to install packages and keep getting errors about `vue-demi` and `peerDependencies`, you can silence
these errors by creating an `.npmrc` file in the root of your project with the following contents:

```txt
shamefully-hoist=true
strict-peer-dependencies=false
legacy-peer-deps=true
```

## File Uploads

While using Feathers-Pinia, keep in mind that adding some types of data to the store can break the data. For example,
when uploading a file, it's common to use a Buffer object. If you pass the Buffer through a Feathers-Pinia method, it
will be wrapped with Vue reactivity and not work as intended.

The solution is to use the underlying, plain Feathers service, which is available as `.service` on every Feathers-Pinia
service.

```ts
const upload = await api.service('uploads').service.create({ buffer: file })
```

You can use the above pattern to avoid any Vue Reactivity-related errors with native types.

## TypeScript

### Missing Service Method Types

When setting up a new project, TypeScript may report that the FeathersPinia service methods are missing. This is due to a missing `ServiceTypes` generic when creating a `feathers` instance. If any of the below-listed methods are missing, you're probably missing a generic.

- `new`
- `findOne`
- `count`
- `findInStore`
- `findOneInStore`
- `countInStore`
- `getFromStore`
- `createInStore`
- `patchInStore`
- `removeFromStore`
- `useFind`
- `useGet`
- `useGetOnce`

The [setup examples](/setup/) show how to properly setup the Feathers client for your framework. If you don't have custom types provided from a Feathers v5 Dove API, you can use the following generic:

```ts
// import the Service type
import { type Service, feathers } from '@feathersjs/feathers'

// Define your custom types (usually imported from another file)
export interface Book {
  _id: string
  title: string
}

// Create a ServiceTypes generic
export interface ServiceTypes {
  'book': Service<Book>
}

// Provide `ServiceTypes` in angle brackets before the parentheses
const feathersClient = feathers<ServiceTypes>()
```

### Package Version Mismatch

Several errors can occur when your `@feathersjs/*` packages do not match the ones used by your currently-installed
version of `feathers-pinia`. This will usually happen if you upgrade your Feathers packages before `feathers-pinia` is
updated.

The solution is to install the same version as `feathers-pinia` is using under the hood. Check the feathers-pinia
package.json.  If `feathers-pinia` is outdated, mention it in the [#vue channel of the Feathers Discord](https://discord.com/invite/qa8kez8QBx).
Until it's updated, downgrade your app to match. This error likely will not occur in `feathers-pinia@3.0.2` and above.

### Typeof Mixins is Incompatible

Sometimes you might see a TypeScript error stating `typeof mixins are incompatible` when calling `createPiniaClient`.
This is caused by the [Package Version Mismatch Error](#package-version-mismatch)

### Service Method Doesn't Exist

If TypeScript complains that a service method like `findInStore` doesn't exist, the [version mismatch error](#package-version-mismatch)
is likely the culprit.
