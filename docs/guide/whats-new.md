---
outline: deep
---

<script setup>
import BlockQuote from '../components/BlockQuote.vue'
</script>

# What's New in 1.0

Feathers-Pinia 1.0 is a huge update with some great new features.  This page will go over some of the highlights.

[[toc]]

## Huge Performance Boost 🎉

Feathers-Pinia is SO MUCH faster than its predecessor.  You'll see massive benefits from the faster reactive types under the hood of Pinia and Vue 3. But we've gone a step further and fine-tuned and tested Feathers-Pinia to never perform extra work.  Some of the biggest improvements are:

- No unnecessary stack frames happen under the hood. We've even written tests to assure that Model constructors only run a single time. We stand firmly against wasted CPU cycles!
- As from the beginning, you still have full control over adding instances to the store with `new User().addToStore()`.
- For the features that require objects to be in the store (for example, `handleClones`) feathers-pinia will implicitly add items to the store when needed.

## Define Default Values on the Class Definition 🎁

[Small breaking change] Defaults values can now be specified directly on the Model interface. Custom constructors have been made much cleaner due to the new `instance.init()` BaseModel method.  After calling `super(data, options)` to initialize the BaseModel, the `init` method can be called from `this`:

```ts
// Minimum required constructor
constructor(data: Partial<Message> = {}, options: Record<string, any> = {}) {
  super(data, options)
  this.init(data)
}
```

Here are the technical details of how the new Model behavior works.  For the TLDR version, just make your Model classes look like next example.

- BaseModel no longer calls `setupInstance`, internally.  If you use a custom constructor together with `instanceDefaults` and `setupInstance`, the two methods are run twice, wasting cycles.
- BaseModel still calls `instanceDefaults` internally, which means it runs twice.  If you are using `instanceDefaults` only for default values, as documented, then the performance impact will be negligible, even when ingesting large amounts of data from the API server.  No complex logic should run in `instanceDefaults`.  It has two purposes. Any use outside of these two purposes should be refactored into `setupInstance`:
   - Allow specifying default values with low boilerplate.
   - Allow conditional defaults values to be assigned based on incoming data.
- Calling `new User(data)` without a custom BaseModel results in Model interface defaults always overwriting `data`.
- Having a custom constructor allows Model instance default values to initialize as one would expect: not overwriting any other values.
- Calling `this.init(data)` runs the `instanceDefaults` again and also runs `setupInstance`.

```ts
// Define the interface and defaults directly on the Model instead of `instanceDefaults`.
export class Message extends BaseModel {
  _id: number
  text = ''
  userId: null | number = null
  createdAt: Date | null = null

  // This is the minimum required constructor
  constructor(data: Partial<Message> = {}, options: Record<string, any> = {}) {
    super(data, options)
    this.init(data)
  }

  static setupInstance(message: Partial<Message>) {
    // access `store` and `models` from this
    const { store, models } = this
  }
}
```

## Built-in Patch Diffing 🎁

<BlockQuote label="PRODUCTIVITY TIP">

Don't waste bandwidth! Just send the props that change!

</BlockQuote>

Patch diffing from Feathers-Vuex is now back in Feathers-Pinia with a smarter, faster algorithm that will work for any scenario you can dream up.

Diffing only occurs on `patch` requests and `save` requests that call a `patch`.

```ts
// clone a record
const clone = user.clone()
// make changes
clone.name = 'Feathers is Amazing!'
// save
await clone.save(). // --> Only the changed props go to the server!
```

<BlockQuote label="HOW IT WORKS" type="details">

- By default, all keys are deep-compared between the original record and the clone.
- Once all changes are found, only the top-level keys are sent to the server.

Diffing will work on all databases without data loss. It will be extensible in the future to support databases that allow patching of deeply-nested values in sub-documents or embedded JSON.

</BlockQuote>

### Customize the Diff

You can use the `diff` option to customize which values are compared.  Only props that have changed will be sent to the server.

```ts
// string: diff only this prop
await clone.save({ diff: 'teamId' )

// array: diff only these props
await clone.save({ diff: ['teamId', 'username'] )

// object: merge and diff these props
await clone.save({ diff: {teamId: 1, username: 'foo' } )

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
await clone.save({ with: {teamId: 1, username: 'foo' } )
```

## Handle Associations

Two new utilities make it easier to add relationships between records without depending on associations in-memory.  You can setup associations in both directions between models.

### `associateFind` 🎁

The `associateFind` utility allows you to define one-to-many relationships on your Model classes.

```ts

export class User extends BaseModel {
  _id: string
  email = ''
  userId: null | number = null
  createdAt: Date | null = null

  // Values added in `setupInstance` can be added to the interface for type friendliness.
  messages?: Array<Partial<User>>

  constructor(data?: Partial<Message>, options: Record<string, any> = {}) {
    super(data, options)
    this.init(data)
  }

  static setupInstance(user: Partial<Message>) {
    // access to `store` and `models` is from `this`.
    const { store, models } = this

    associateFind(user, 'messages', {
      Model: models.api.Message,
      makeParams: (user) => {
        return { query: { id: user._id } }
      },
    })
  }
}
```

### `associateGet` 🎁

## Store API Improvements

The `useFind` utility -- for implementing fall-through-cached `find` requests -- is now available directly on the store, further reducing boilerplate.

### `store.useFind`

With the old way, you have to import `useFind` and provide the model to it from the instantiated store. 

```ts
import { useFind } from 'feathers-pinia'
import { useTutorials } from '../store/tutorials'

const tutorialStore = useTutorials()
const tutorialsParams = computed(() => {
  return { query: {}, }
})
const { items: tutorials } = useFind({ model: tutorialStore.Model, params: tutorialsParams })
```

In the new way, there's no need to import useFind. Call it as a method on the store and don't pass `model`

```ts
import { useTutorials } from '../store/tutorials'

const tutorialStore = useTutorials()
const tutorialsParams = computed(() => {
  return { query: {}, }
})
const { items: tutorials } = tutorialStore.useFind({ params: tutorialsParams })
```

Just think of all of the extra time you'll have instead of having to write those 1.5 lines of code over and over again! 😁

### `store.useGet`

The `useGet` utility -- for implementing fall-through-cached `get` requests -- is now available directly on the store, further reducing boilerplate.

## LocalStorage Plugins 🎉

The new LocalStorage adapter is so fast that it makes Single Page Apps feel like they're doing Server Side Rendering.

### Opt in to Compressed Storage

We've made a separate, localStorage plugin that uses LZW compression. Compressed storage allows you to save twice as much information in the same amount of space.

## Lots of Little Improvments
