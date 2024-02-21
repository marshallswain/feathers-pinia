---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Modeling Utilities

<BlockQuote type="danger" label="Deprecated APIs">

The `defineValues`, `defineGetters`, and `defineSetters` utilities are all deprecated. They have been replaced by new 
[Data Modeling utilities](/guide/data-modeling) in feathers-pinia v4.2.

</BlockQuote>

Learn how to model data with `defineValues`, `defineGetters`, and `defineSetters`

[[toc]]

These utilities are a shorthand for adding properties to objects. They can be useful for data modeling. Arrow functions
are not supported.

## defineValues <Badge type="danger"> Deprecated </Badge>

```ts
defineValues(record, object)
```

For adding configurable, non-enumerable properties to items.

## defineGetters <Badge type="danger"> Deprecated </Badge>

For adding configurable, non-enumerable getters to items.

```ts
defineGetters(record, objectOfFunctions)
```

## defineSetters <Badge type="danger"> Deprecated </Badge>

```ts
defineSetters(record, objectOfFunctions)
```

For adding configurable, non-enumerable setters to items.

## Example Associations

```ts {25-38,45-52,59-66}
import { defineGetters, defineSetters } from 'feathers-pinia'

export const api = createPiniaClient(feathersClient, {
  pinia,
  idField: '_id',
  whitelist: ['$regex'],
  paramsForServer: [],
  services: {
    users: {
      idField: 'id',
    },
    contacts: {
      whitelist: ['$test'],
      setupInstance(data: any) {
        const withDefaults = useInstanceDefaults({ name: '', age: 0 }, data)
        return withDefaults
      },
    },
    tasks: {
      skipGetIfExists: true,
    },
    authors: {
      setupInstance(author, { app }) {
        const withDefaults = useInstanceDefaults({ setInstanceRan: false }, author)
        const withAssociations = defineGetters(withDefaults, {
          posts(this: Authors) {
            return app.service('posts').useFind({ query: { authorId: this.id } })
          },
          comments(this: Authors) {
            return app.service('comments').useFind({ query: { authorId: this.id } })
          },
        })
        const withAssociationSetters = defineSetters(withAssociations, {
          posts(this: Posts, post: Posts) {
            author.setInstanceRan = true
            if (post.id && !this.authorIds.includes(post.id))
              post.authorIds.push(post.id)
          },
        })
        return withAssociationSetters
      },
    },
    posts: {
      setupInstance(post, { app }) {
        const withDefaults = useInstanceDefaults({ authorIds: [] }, post)
        const withAssociations = defineGetters(withDefaults, {
          authors(this: Posts) {
            return app.service('authors').useFind({ query: { id: { $in: this.authorIds } } })
          },
          comments(this: Posts) {
            return app.service('comments').useFind({ query: { postId: this.id } })
          },
        })
        return withAssociations
      },
    },
    comments: {
      setupInstance(comment, { app }) {
        const withDefaults = useInstanceDefaults({ description: '', isComplete: false }, comment)
        const withAssociations = defineGetters(withDefaults, {
          post(this: Comments) {
            return app.service('posts').useGet(this.postId)
          },
          author(this: Comments) {
            return app.service('authors').useGet(this.authorId)
          },
        })
        return withAssociations
      },
    },
  },
})
```
