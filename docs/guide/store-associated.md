---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# The `storeAssociated` Utility

Learn how to store associated data in its proper stores.

<BlockQuote type="danger">

The `storeAssociated` API is deprecated.  As of Feathers-Pinia v4.2 it has been replaced with a suite of smaller, 
more-flexible, single-purpose utilities. See [Data Modeling](/guide/data-modeling) for the new way to store associated 
data.

</BlockQuote>

[[toc]]

Every Feathers-Pinia Client includes a `storeAssociated` method, which receives a `data` object and a `config` object which
tells the utility the service in which to store the associated data.

## storeAssociated <Badge type="danger"> Deprecated </Badge>

```ts
storeAssociated(data, config)
```

- **data {Object}** any record
- **config {Object}** an object with keys that represent a key from `data` and where the values are service paths.

Note that `storeAssociated` should generally be used first in `setupInstance`.

## Example

See `storeAssociated` as configured in the `posts` service of this example:

```ts
export const api = createPiniaClient(feathersClient, {
  pinia,
  idField: 'id',
  services: {
    authors: {
      setupInstance(author, { app }) {
        const withDefaults = useInstanceDefaults({ setInstanceRan: false }, author)
        return withDefaults
      },
    },
    posts: {
      idField: 'id',
      setupInstance(post, { app }) {
        app.storeAssociated(post, {
          author: 'authors',
          comments: 'comments',
        })
        const withDefaults = useInstanceDefaults({ authorIds: [] }, post)

        return withDefaults
      },
    },
    comments: {
      idField: 'id',
      setupInstance(comment, { app }) {
        const withDefaults = useInstanceDefaults({ description: '', isComplete: false }, comment)
        return withDefaults
      },
    },
  },
})
```

Now when you create an instance with data matching those keys, the related data will move to the associated stores.

```ts
const post = api.service('posts').new({
  title: 'foo',
  author: { id: 2, name: 'Steve' },
  comments: [
    { id: 1, text: 'comment 1', authorId: 1, postId: 1 },
    { id: 2, text: 'comment 2', authorId: 1, postId: 1 },
  ],
})

post.createInStore()
```

If you inspect `post` in the above example, you'll find the following:

- `post.author` is an author instance, already created in the `authors` service store.
- `post.comments` is an array of comment instances, already created in the `comments` service store.
- The `post.author` and individual records in `post.comments` are all reactive. So if they get updated in their
stores, the values on `post` will reflect the change.
- The `post.comments` list length is not reactive.
- We still have to manually call `post.createInStore()` afterwards to add it to the `posts` service store.
- Finally, all of the values have been rewritten as non-enumerable, so if you call `post.save()`, the related data will
not be sent in the request to the API server.
