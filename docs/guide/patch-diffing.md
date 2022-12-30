<BlockQuote label="Efficiency Tip">

Don't waste bandwidth! Just send the props that change!

</BlockQuote>

Patch diffing, which originated in Feathers-Vuex, is now back in Feathers-Pinia with a smarter, faster algorithm that
will work for any scenario you can dream up.

Diffing only occurs on `patch` requests (and when calling `instance.save()` calls a `patch`).

```ts
// clone a record
const clone = user.clone()
// make changes
clone.name = 'Feathers is Amazing!'
// save
await clone.save(). // --> Only the changed props go to the server!
```

<BlockQuote label="How It Works" type="info">

- By default, all keys are deep-compared between the original record and the clone.
- Once all changes are found, only the top-level keys are sent to the server.

Diffing will work on all databases without data loss.

</BlockQuote>

### Customize the Diff

You can use the `diff` option to customize which values are compared.  Only props that have changed will be sent to the server.

```ts
// string: diff only this prop
await clone.save({ diff: 'teamId' )

// array: diff only these props
await clone.save({ diff: ['teamId', 'username'] )

// object: merge and diff these props
await clone.save({ diff: { teamId: 1, username: 'foo' } )

// or turn off diffing and send everything
await clone.save({ diff: false })
```

### Always Save Certain Props

If there are certain props that need to always go with the request, use the `with` option:

```ts
// string: always include this prop
await clone.save({ with: 'teamId' )

// array: always include these props
await clone.save({ with: ['teamId', 'username'] )

// object: merge and include these props
await clone.save({ with: { teamId: 1, username: 'foo' } )
```

### Specify Patch Data

When calling `.save()` or `.patch()`, you can provide an object as `params.data`, and Feathers-Pinia will use it as the
patch data. This bypasses the `diff` and `with` params.

```js
const task = Task({ description: 'Do Something', isComplete: false })
await task.patch({ data: { isComplete: true } })
```
