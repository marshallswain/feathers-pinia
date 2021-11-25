# handleClones

The `handleClones` utility makes working with form data easier.  It automatically handles the following features in a fairly smart way:

- Data diffing for `patch` requests. Only send the data to the server that has actually changed.
- The clone and commit pattern runs under the hood, keeping calls to store actions to a minimum.
- Eager updates with full control over whether data gets committed to store or saved to the server.
- Work with temp records or records already in the store.
- Flexible, developer friendly ways to call the save handlers.

## Basic Setup

The `handleClones` utility is exported directly from `feathers-pinia`.  It expects to receive a components `props` object or any object with model instances at the top level. It returns an object with two properties:

- `clones` is an object which will contain a key matching that of every Model instance found in the original `props`. In the below example, if a User instance is passed in the `props`, the `clones` object will contain `clones.user`.
- `saveHandlers` contains a function for each of the items in `clones`. the name of the function is the same as the original prop, but prefixed with `save_`.  In the below example, notice the `save_user` function.

```vue
<template>
  <div>
    <input
      v-model="clones.user.name"
      type="text"
      placeholder="Enter the User's Name"
      @keyup.enter="() => save_user()"
    />
    <button @click="() => save_user()"> Save </button>
  </div>
</template>

<script setup lang="ts">
import { handleClones } from 'feathers-pinia'

const props = defineProps({
  user: { type: Object },
})

const { clones, saveHandlers } = handleClones(props)
const { save_user } = saveHandlers
</script>
```

## Using the `save_handlers`

The saveHandlers change their behavior slightly depending on the first argument you provide.  The argument provided will determine which keys get compared between the original item and the clone to check if a request should be sent to the API server:

- `string` like `save_user('name')` will compare `name` property on each object. Dotted paths can be used for values nested inside of objects. The dotted string will be used to compare the deeply-nested values. The entire top-level object will be sent to the server.
- `array` like `save_user(['name', address])` will compare the keys named in the provided array. The same rules as in `string`, above, apply for dotted strings.
- `object` like `save_user({ name: 'foo' })` will compare the provided object's keys with the original record.
- `undefined`, like `save_user()` will compare all of the clone's keys with the original record.

### `save_handler` options

Each saveHandler also accepts an `options` object as its second argument.  The following options are available:

- `commit {Boolean}` whether to call clone.commit() before saving. default: true
- `diff {Boolean}` whether to auto-diff and only save changed properties. See the details, below. default: true
- `save { Boolean}` whether to call save if item[prop] and clone[prop] are not equal. default: true
- `saveWith {Function}` a function which receives the the original `item`, the `clone`, the changed `data`, and the `pick` method from feathers. The return value from `saveWith` should be an object. The returned object will be merged into the patch data.

### `save_handler` Return Values

Each save_handler returns a promise.  Any successful request conforms to `Promise<SaveHandlerReturn>`.

```ts
interface SaveHandlerReturn {
  areEqual: boolean,
  wasDataSaved: boolean,
  item: ApiResult
}
```

This response will be different depending on if a request was actually made.

- `areEqual` will return the result of the internal `lodash.isEqual`, regardless of whether data was sent to the server.
- `wasDataSaved` will be `true` if an API request was made.
- `item` will be either (A) the response from the API server if a request was made, or (B) the original item from the store (original item as in not the clone).

## Using with Temp Records

The `handleClones` utility supports temp records (instances which aren't yet in the store OR don't have an `idField` property).  Keep in mind that once temp records have been saved, they get moved in the state from `tempsById` to `itemsById`.  This means that you may need to make an adjustment to obtain the correct data after saving a temp. For example, instead of passing the temp record to the `user` in the first example, the correct record retrieved from the store's `itemsById` would need to be provided after saving.

An example of this behavior can be seen in the `vitesse-feathers-pinia` project on Github. The `/users/new` page allows creating a user, then upon creation the app redirects to the `/user/[userid]` page which uses the same component, but with the correct `user` record passed in.

## Diffing Data for Patch/Update

Each `save_handler` supports automated diffing when called with no arguments.  Logically, diffing does not work for `create` requests. There must be a baseline against which to compare.  This means`patch` and `update` requests can support diffing, but you probably only want to use it for `patch`.  (Technically, nothing prevents you from using it for `update` requests. If you find a valid use case, come share it on Slack 🤓)

In the example code, below, assume that a `user` instance with 10 keys has been provided to the `user` prop.

```js
const { clones, saveHandlers } = handleClones(props)
const { save_user } = saveHandlers

clones.user.name = 'Edited Name'

// Only saves the `name` that changed
save_user()

// Set `diff` to false to send the entire object.
save_user(undefined, { diff: false })

```

Note that under the hood lodash's `isEqual` is being run against each top-level key in the object.  While looping through and comparing dep objects is not typically a high performance operation, it's *usually* fine for moderate-frequency requests or shallow objects, which is the purpose of `handleClones`.

If you somehow find yourself in a position where you need to save 10+ highly-complex model instances all at once, you might consider **manually** specifying data to save by passing an array of key names or an object:

```js
const { clones, saveHandlers } = handleClones(props)
const { save_user, save_other, save_another, save_etc } = saveHandlers

/* suppose you make a bunch of changes to all of the values */

// Mabye this is performant, depending on data structure, processor speed, browser conditions, what the user had for breakfast.
save_user()
save_other()

// You might consider manually specifying which props have changed, if plausible in your app.
save_user({ foo: true }) // only this data gets sent
save_other(['foo']) // only these keys from the clone get `picked` and sent
```
