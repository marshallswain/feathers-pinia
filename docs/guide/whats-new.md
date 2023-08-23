---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# What's New in 4.0

[[toc]]

Version 4.0 of Feathers-Pinia is about improving developer experience.  It focuses on the `useFind`, `findInStore`, and
`useGet` APIs.

## API Changes

The `useFind`, `findInStore`, and `useGet` APIs now return `reactive` objects instead of objects of individual ref
properties. This means that you can use the returned objects directly in your templates, without having to unwrap them
with `.value`. The end result is much cleaner `script` code, especially when using multiple `useFind` calls in the same
component.  Let's start with `useFind` examples.

### service.useFind

The `useFind` service method now returns a `reactive` object.  Below are examples of the old way and the new way. Note
that destructuring the object will break reactivity, so you'll want to use the object directly.

Since the new APIs return `reactive` objects, you can keep everything together in a single object. This removes the need
to use `.value` to reference properties within the `script`.

::: code-group

```ts [The Old Way]
// the old way with destructuring

const { api } = useFeathers()
const $route = useRoute()

const orgsParams = computed(() => ({ query: { slug: $route.params.orgSlug } }))
const {
  data: orgs,
  request: orgsRequest,
  isSsr, areOrgsPending,
  next: orgsNext,
  prev: orgsPrev
} = api.service('orgs').useFind(orgsParams, { paginateOn: 'hybrid' })

const projectsParams = computed(() => ({ query: { slug: $route.params.projectSlug } }))
const {
  data: projects,
  request: projectsRequest,
  isSsr, areProjectsPending,
  next: projectsNext,
  prev: projectsPrev
} = api.service('projects').useFind(projectsParams, { paginateOn: 'hybrid' })

isSsr.value && await Promise.all([orgsRequest, projectsRequest])

// call destructured methods
await orgsNext()
await orgsPrev()
await projectsNext()
await projectsPrev()
```

```ts [The New Way]
// the new way with reactive objects

const { api } = useFeathers()
const $route = useRoute()

const orgsParams = computed(() => ({ query: { slug: $route.params.orgSlug } }))
const orgs$ = api.service('orgs').useFind(orgsParams)

const projectsParams = computed(() => ({ query: { slug: $route.params.projectSlug } }))
const projects$ = api.service('projects').useFind(projectsParams, { paginateOn: 'hybrid' })

projects$.isSsr && await Promise.all([orgs$.request, projects$.request])

// call methods within the same object
await orgs$.next()
await orgs$.prev()
await projects$.next()
await projects$.prev()
```

```ts [Using toRefs]
// if you still want to destructure, use toRefs from VueUse
import { toRefs } from '@vueuse/core'

const { api } = useFeathers()
const $route = useRoute()

const orgsParams = computed(() => ({ query: { slug: $route.params.orgSlug } }))
const {
  data: orgs,
  request: orgsRequest,
  isSsr, areOrgsPending,
  next: orgsNext,
  prev: orgsPrev
} = toRefs(api.service('orgs').useFind(orgsParams, { paginateOn: 'hybrid' }))

const projectsParams = computed(() => ({ query: { slug: $route.params.projectSlug } }))
const {
  data: projects,
  request: projectsRequest,
  isSsr, areProjectsPending,
  next: projectsNext,
  prev: projectsPrev
} = toRefs(api.service('projects').useFind(projectsParams, { paginateOn: 'hybrid' }))

isSsr.value && await Promise.all([orgsRequest.value, projectsRequest.value])

// utility functions referenced in `script` will need to be called with `.value()`
await orgsNext.value()
await orgsPrev.value()
await projectsNext.value()
await projectsPrev.value()
```

:::

It's still possible to destructure the returned object if you use the
[`toRefs` utility](https://vueuse.org/shared/toRefs/#torefs).  This will restore previous functionality with one caveat:
all utility methods will also be wrapped in a `ref`.  This means that you'll need to unwrap them with `.value` when
using them in your scripts. (Templates will still work without unwrapping.)

### service.useGet

The `useGet` method has been modified in exactly the same way as the [useFind method](#serviceusefind), above.

### service.findInStore

The `findInStore` service method now returns a `reactive` object.  Below are examples of the old way and the new way.

::: code-group

```ts [The Old Way]
// the old way with destructuring

const { api } = useFeathers()
const $route = useRoute()

const orgsParams = computed(() => ({ query: { slug: $route.params.orgSlug } }))
const {
  data: orgs,
  limit: orgsLimit,
  skip, orgsSkip,
  total: orgsTotal,
} = api.service('orgs').findInStore(orgsParams)

const projectsParams = computed(() => ({ query: { slug: $route.params.projectSlug } }))
const {
  data: projects,
  limit: projectsLimit,
  skip: projectsSkip,
  total: projectsTotal,
} = api.service('projects').findInStore(projectsParams)
```

```ts [The New Way]
// the new way with reactive objects

const { api } = useFeathers()
const $route = useRoute()

const orgsParams = computed(() => ({ query: { slug: $route.params.orgSlug } }))
const orgs$ = api.service('orgs').findInStore(orgsParams)

const projectsParams = computed(() => ({ query: { slug: $route.params.projectSlug } }))
const projects$ = api.service('projects').findInStore(projectsParams)
```

```ts [Using toRefs]
// if you still want to destructure, use toRefs from VueUse
import { toRefs } from '@vueuse/core'

const { api } = useFeathers()
const $route = useRoute()

const orgsParams = computed(() => ({ query: { slug: $route.params.orgSlug } }))
const {
  data: orgs,
  limit: orgsLimit,
  skip, orgsSkip,
  total: orgsTotal,
} = toRefs(api.service('orgs').findInStore(orgsParams))

const projectsParams = computed(() => ({ query: { slug: $route.params.projectSlug } }))
const {
  data: projects,
  limit: projectsLimit,
  skip: projectsSkip,
  total: projectsTotal,
} = toRefs(api.service('projects').findInStore(projectsParams))
```

:::

## Improved `getFromStore`

In addition to the above changes, the `getFromStore` method has been updated so that the internal `computed` now works
for reactivity.  This means that you no longer need to wrap it in a `computed` in your `script` code.  You can just use
it directly.

::: code-group

```ts [The Old Way]
const { api } = useFeathers()
const $route = useRoute()

const org = computed(() => api.service('orgs').getFromStore($route.params.orgId))
```

```ts [The New Way]
const { api } = useFeathers()
const $route = useRoute()

const org = service.getFromStore($route.params.orgId)
```

:::
