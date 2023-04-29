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

## TypeScript

### Package Version Mismatch

Several errors can occur when your `@feathersjs/*` packages do not match the ones used by your currently-installed
version of `feathers-pinia`. This will usually happen if you upgrade your Feathers packages before `feathers-pinia` is
updated.

The solution is to install the same version as `feathers-pinia` is using under the hood. Check the feathers-pinia
package.json.  If `feathers-pinia` is outdated, mention it in the [#vue channel of the Feathers Discord](https://discord.com/invite/qa8kez8QBx).
Until it's updated, downgrade your app to match. If anybody has a solution that allows TypeScript to not throw an error
when the package versions don't match, please let us know.

### Typeof Mixins is Incompatible

Sometimes you might see a TypeScript error stating `typeof mixins are incompatible` when calling `createPiniaClient`.
This is caused by the [Package Version Mismatch Error](#package-version-mismatch)

### Service Method Doesn't Exist

If TypeScript complains that a service method like `findInStore` doesn't exist, the [version mismatch error](#package-version-mismatch)
is likely the culprit.
