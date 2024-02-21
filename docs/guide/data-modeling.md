---
outline: deep
---
<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Data Modeling

[[toc]]

Feathers-Pinia v4.2 introduced some FeathersPinia methods to help form relationships between services inside your 
`setupInstance` functions. Let's review what they do before seeing a full example.

<BlockQuote type="warning">

In all of the below examples, the exported `books` object can be passed to the `services` config when calling 
[createPiniaClient](/guide/create-pinia-client). 

</BlockQuote>

## pushToStore

The FeathersPinia client's `pushToStore` method pushes data into a related store.

```ts
import { PiniaServiceConfig } from 'feathers-pinia'

export const books: PiniaServiceConfig = {
  setupInstance(data: any, { app }: any) {

    // replace data.pages with stored pages
    data.pages = app.pushToStore(data.pages, 'pages')

    return data
  },
}
```

The above example uses `app.pushToStore` to replace `data.pages` with the pages in the `pages` service store. If the
data didn't exist already, it will be added. If it did exist, the store record will be patched with any new data. The 
`data.pages` array will be a static array, not adjusting its length when new data arrives. So we need another 
utility to make it reactive: `defineVirtualProperty`.

## defineVirtualProperty

The FeathersPinia client's `defineVirtualProperty` method sets up a virtual property on an object. We can use it to 
define reactive properties on instances. In the following example, we no longer replace `data.pages` with stored pages. 
Instead, we overwrite the `pages` property with a virtual getter that returns the stored pages.  

<BlockQuote type="warning">

if you're defining more than one virtual property, use [defineVirtualProperties](#definevirtualproperties) instead.

</BlockQuote>


```ts
import { PiniaServiceConfig } from 'feathers-pinia'

export const books: PiniaServiceConfig = {
  setupInstance(data: any, { app }: any) {

    // store the page records
    app.pushToStore(data.pages, 'pages')
    // define a findInStore virtual property
    app.defineVirtualProperty(data, 'pages', (item: any) => {
      return app.service('pages').findInStore({ query: { book_id: item.id } }).data
    })

    // store the creator record
    app.pushToStore(data.creator, 'users')
    // define a getFromStore virtual property
    app.defineVirtualProperty(data, 'creator', (item: any) => {
      return app.service('users').getFromStore(item.created_by)
    })

    return data
  },
}
```

All virtual properties are lazily evaluated (they only run when you reference them), making them very lightweight.
Virtual properties are non-enumerable, so they'll never be accidentally sent to the API server. But you could create a 
client-side Feathers hook to send them if you wanted to.

It's a bit verbose when you need to define more than one virtual property, so let's instead define many at once with
[defineVirtualProperties](#definevirtualproperties)

## defineVirtualProperties

The FeathersPinia client's `defineVirtualProperties` method sets up multiple virtual properties on an object. We can use 
it to define lots of reactive properties on our instances. In the following example, we define two virtual properties: 
`pages` and `creator`.

```ts
import { PiniaServiceConfig } from 'feathers-pinia'

export const books: PiniaServiceConfig = {
  setupInstance(data: any, { app }: any) {

    // store related data
    app.pushToStore(data.pages, 'pages')
    app.pushToStore(data.creator, 'users')

    // overwrite the original properties with virtual properties
    app.defineVirtualProperties(data, {
      // findInStore example
      pages: (item: any) => {
        return app.service('pages').findInStore({ query: { book_id: item.id } }).data
      },
      // getFromStore example
      creator: (item: any) => {
        return app.service('users').getFromStore(item.created_by)
      },
    })

    return data
  },
}
```

Since we used store methods, the `pages` and `creator` properties are computed properties. Remember, the `data` property 
returned from `findInStore` is a computed property, and so is the value returned by `getFromStore`. As mentioned 
earlier, Virtual properties are non-enumerable, so they'll never be accidentally sent to the API server. But you could
create a client-side Feathers hook to send them if you wanted to.

## Complete Example with Types

This example begins by showing how to use the `ServiceInstance` type to define a `Book` type.

```ts
import { type ServiceInstance, type PiniaServiceConfig, defineVirtualProperties, pushToStore, useInstanceDefaults } from 'feathers-pinia'
import type { UserWithIncludes } from './users'
import type { PageWithIncludes } from './pages'

// Define the `Book` type
export interface Book {
  id?: string
  title: string
  description?: string
  created_by?: string
  created_at?: number
  updated_at?: number
}
// Define types for related data
export interface BookIncludes {
  pages: PageWithIncludes[]
  creator: UserWithIncludes
}
export type BookWithIncludes = ServiceInstance<Book & BookIncludes>

// Create the books service configuration
export const books: PiniaServiceConfig = {
  setupInstance(data: BookWithIncludes, { app }: any) {
    data = useInstanceDefaults({
      title: '🐸 Book',
    }, data)

    // move related data to the correct stores
    app.pushToStore(data.pages, 'pages')
    app.pushToStore(data.creator, 'users')

    // virtual properties
    app.defineVirtualProperties(data, {
      // findInStore example
      pages: (item: Book) => {
        return app.service('pages').findInStore({ query: { book_id: item.id } }).data
      },
      // getFromStore example
      creator: (item: Book) => {
        return app.service('users').getFromStore(item.created_by)
      },
    })

    return data
  },
}
```

## Review the Benefits

Let's review the benefits:

- Segregating our data into service stores organizes it to be flexibly reused throughout our applications. The
`pushToStore` utility does it elegantly.
- Defining reactive virtual properties on our instances puts related data directly on each instance. Having ready access
to related data is a huge timesaver and prevents writing a lot of boilerplate code in our components.
- This sort of functional declarative code is concise, clear, and testable. It's a joy to work with.