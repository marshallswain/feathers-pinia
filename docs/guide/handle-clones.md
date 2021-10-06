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
      @keyup.enter="save"
    />
    <button @click="() => save_user('name')"> Save </button>
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

## Using the `saveHandlers`

The saveHandlers change their behavior slightly depending on the first argument you provide.  The argument provided will determine which keys get compared between the original item and the clone to check if a request should be sent to the API server:

- `string` like `save_user('name')` will compare `name` property on each object. Dotted paths can be used for values nested inside of objects. The dotted string will be used to compare the deeply-nested values. The entire top-level object will be sent to the server.
- `array` like `save_user(['name', address])` will compare the keys named in the provided array. The same rules as in `string`, above, apply for dotted strings.
- `object` like `save_user({ name: 'foo' })` will compare the provided object's keys with the original record.
- `undefined`, like `save_user()` will compare all of the clone's keys with the original record.

### `saveHandler` options

Each saveHandler also accepts an `options` object as its second argument.  The following options are available:

- `commit {Boolean}` whether to call clone.commit() before saving. default: true
- `save { Boolean}` whether to call save if item[prop] and clone[prop] are not equal. default: true
- `saveWith {Function}` a function which receives the the original `item`, the `clone`, the changed `data`, and the `pick` method from feathers. The return value from `saveWith` should be an object. The returned object will be merged into the patch data.

## Using with Temp Records

The `handleClones` utility supports temp records (instances which aren't yet in the store OR don't have an `idField` property).  Keep in mind that once temp records have been saved, they get moved in the state from `tempsById` to `itemsById`.  This means that you may need to make an adjustment to obtain the correct data after saving a temp. For example, instead of passing the temp record to the `user` in the first example, the correct record retrieved from the store's `itemsById` would need to be provided after saving.

An example of this behavior can be seen in the `vitesse-feathers-pinia` project on Github. The `/users/new` page allows creating a user, then upon creation the app redirects to the `/user/[userid]` page which uses the same component, but with the correct `user` record passed in.
