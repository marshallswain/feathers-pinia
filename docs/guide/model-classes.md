# Model Classes

Each Service Store gets its own Model Class.  If you don't explicitly create it, one gets created under the hood.  There are some benefits to using them:

- Convenient access to Feathers Service methods.  Methods directly on the Model will effect the store.  You can also directly access the Feathers service at `Model.service`.  Using the Feathers Service directly allows you to bypass the store when needed.
- The Model Class API provides a common interface that abstracts away the underlying implementation.  This is similar to how FeathersJS database adapters work.  FeathersJS supports many database adapters.  By swapping out an adapter, the same code that was previously running on one database now runs on some other database.
- You can extend the common interface with custom methods, getters, and setters.

## Model Class Optional

On the section on [Setup: Service Stores](./setup#service-stores), we learned how to setup a basic service store with a Model class.

In Feathers-Pinia, model classes are not required in all cases.  Model classes are especially beneficial to

- Define Relationships with other stores 🥰
- Define default data.  This is especially important if we add support for Vue 2.
- Be able to use the `new` operator.  No Model class means to `new`.

If neither of the above scenarios applies to your situation, you can shorten the service setup and remove the `Model`.

```ts
import { defineStore, BaseModel } from './store.pinia'
import { api } from '../feathers'

const servicePath = 'users'
export const useUsers = defineStore({ servicePath })

api.service(servicePath).hooks({})
```

If you don't provide a Model class, one will be created dynamically using the servicePath as the class name.  This means that you can still take advantage of instance methods!  It's pretty convenient!


### Working without a model class

One caveat about working WITHOUT a Model class is that you can't use the `new` operator (you know, since that requires a class;).  To add an item to the store, pass an object to the `addToStore` action.

```vue
<script setup lang="ts">
import { useUsers } from '~/store/users.pinia.ts'

const usersService = useUsers()

usersService.addToStore({ id: 0, name: 'Marshall' })
</script>
```

## Default Class Properties

Another potential caveat with using Model classes in Feathers-Pinia is that any default values defined on a class will override and overwrite the values provided in `instanceDefaults` UNLESS you assign them again in the extending class's constructor. Read the comment and string values in the next example for more information.

```ts
import { defineStore, BaseModel } from './store.pinia'

class Message extends BaseModel {
  // This doesn't work as a default value. It will overwrite all passed-in values and always be this value.
  text = 'The text in the model always wins. You can only overwrite it after instantiation'

  static instanceDefaults(data: Message) {
    return {
      text: 'this gets overwritten by the class-level `text`',
      otherText: `this won't get overwritten and works great for a default value`
    }
  }
}

const message = new Message({ text: 'hello there!' })
console.log(message.text) // --> 'The text in the model always wins. You can only overwrite it after instantiation'
```

Notice in the above example how even though we've provided `text: 'hello there!'` to the new message, the value ends up being the default value defined in the class definition.  This is an important part of how extending classes works in JavaScript.  If you definitely require to define instance properties inside the class definition, the workaround is to add a `constructor` to the class and re-assign the properties in the same way that the `BaseModel` constructor does it.  Here's what it looks like:

```ts
import { defineStore, BaseModel } from './store.pinia'

class Message extends BaseModel {
  // This doesn't work as a default value. It will overwrite all passed-in values and always be this value.
  text = 'The text in the model always wins. You can only overwrite it after instantiation'


  constructor(data: any, options: any = {}) {
    const { store, instanceDefaults, setupInstance } = this.constructor as typeof BaseModel

    // You must call `super` to instantiate the BaseModel
    super(data, options)

    // Assign the default values again, because you can override this class's defaults inside this class's `constructor`.
    Object.assign(this, instanceDefaults(data, { models, store })) // only needed when this class implements `instanceDefaults`
    Object.assign(this, setupInstance(data, { models, store })) // only needed when this class implements `setupInstance`
    return this
  }

  static instanceDefaults(data: Message, store: any) {
    return {
      text: 'this gets overwritten by the class-level `text`',
      otherText: `this won't get overwritten and works great for a default value`
    }
  }
}

const message = new Message({ text: 'hello there!' })
console.log(message.text) // --> 'hello there!'
```

## Recipes

### Compound Keys

I've not tried this, but it might be possible to support compound keys in the `idField` of a service by following these steps:

1. Create a custom class (`extends BaseModel`)
2. Add a virtual property to the class using ES5 accessors `get` and `set`.
3. Use the name of the virtual property as the `idField` in the `defineStore` options.

It would look something like the example, below.

```ts
import { defineStore, BaseModel } from 'feathers-pinia'
import { Id } from '@feathersjs/feathers'
import { api } from '../feathers'

// (1)^
export class User extends BaseModel {
  static instanceDefaults() {
    return {
      name = ''
      timezone: ''
    }
  }

  get myCompoundKey() {
    return `${this.name}:${this.timezone}`
  }
  // This would be necessary if you were going to manually set the key on the frontend.
  set myCompoundKey(val: string) {
    const [name, timezone] = val.split(':')
    this.name = name
    this.timezone = timezone
  }
}

const servicePath = 'users'
export const useUsers = defineStore({
  idField: 'id',    // (2)
  clients: { api }, // (2)
  servicePath,
  Model: User
})

api.service(servicePath).hooks({})
```

If you do try it out, please let me know in an issue or make a PR to the docs. If it works, the wording of this section should be updated with more certainty. 🤓