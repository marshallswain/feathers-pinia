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

## Usage Problems

### File Uploads

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
