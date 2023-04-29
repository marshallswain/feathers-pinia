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

### Typeof Mixins is Incompatible

Sometimes you might see a TypeScript error stating `typeof mixins are incompatible` when calling `createPiniaClient`.
This will happen when your `@feathersjs/*` packages do not match the ones used by your currently-installed version of
`feathers-pinia`. This will usually happen if you upgrade your Feathers packages before `feathers-pinia` is updated.

The solution is to install the same version as `feathers-pinia` is using under the hood. Check the feathers-pinia
package.json.  If `feathers-pinia` is outdated, mention it in the [#vue channel of the Feathers Discord](https://discord.com/invite/qa8kez8QBx).
Until it's updated, downgrade your app to match. If anybody has a solution that allows TypeScript to not throw an error
when the package versions don't match, please let us know.
