# Migration from Vuex ≤ 4

Despite the structure of Vuex and Pinia stores being different, a lot of the logic can be re-used. This guide serves to outline the basic steps required for migrating a project using Feathers Vuex to Feathers Pinia.

> Vuex 3.x is Vuex for Vue 2 while Vuex 4.x is for Vue 3

## Restructuring Modules to Stores

The following structure (adapted from the [pinia official documentation](https://pinia.esm.dev/cookbook/migration-vuex.html#restructuring-modules-to-stores)) shows how to organize your pinia stores, alongside those augmented with feathers-pinia.

```sh
# Vuex example (assuming namespaced modules)
src
└── store
    ├── index.js           # Initializes Vuex, imports modules
    └── modules
        ├── module1.js     # 'module1' namespace
        └── nested
            ├── index.js   # 'nested' namespace, imports module2 & module3
            ├── module2.js # 'nested/module2' namespace
            └── module3.js # 'nested/module3' namespace

# Pinia equivalent, note ids match previous namespaces
src
└── stores
    ├── index.js          # (Optional) Initializes Pinia, does not import stores
    ├── module1.js        # 'module1' id
    ├── module1.js        # 'module1' id
    ├── store.js          # (Optional) Initializes Pinia, does not import stores
    ├── service1.js       # 'service1' id
    └── service2.js       # 'service2' id
```

The optional `src/stores/index.js` file is for convenience to import stores from a single file:

```javascript
import { useStore1, useStore2, useStore3 } from '@/stores'
```

instead of:

```javascript
import { useStore1 } from '@/stores/store-1'
import { useStore2 } from '@/stores/store-2'
import { useStore3 } from '@/stores/store-3'
```

**Important**
To differentiate feathers-pinia augmented stores we add a `.service` prefix to the filename.
This is important since for example, the native `defineStore` method of pinia requires state to be a function which returns an object (`state: () => ({...})`) while the `defineStore` method of feathers-pinia expects an object directly (`state: {...}`).
