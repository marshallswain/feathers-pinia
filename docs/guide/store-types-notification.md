
<BlockQuote label="A Note About Store Types">

Currently, when you access the store through the Model (at `Model.store`), the types cannot be customized. (This is due
to a circular dependency in the current types.) As a result, if you add custom state to the pinia store it does not
currently show up in the types at `Model.store`. To work around this minor limitation, you can directly reference the
pinia store. For example:

```ts
// Fully-typed, even with customizations.
const store = useTaskStore()

// Always matches the return of useService, even when the store is customized
const Task = useTaskModel()
console.log(Task.store) // correct values, incorrect types.
```

</BlockQuote>
