:::code-group

```ts [With Auto-Imports]
import type { ModelInstance } from 'feathers-pinia'
import type { User, UserData, UserQuery } from 'feathers-pinia-api'

export const useUsersConfig = () => {
  const { pinia, idField, whitelist } = useFeathersPiniaConfig()
  const servicePath = 'users'
  const service = useFeathersService<User, UserQuery>(servicePath)
  const name = 'User'

  return { pinia, idField, whitelist, servicePath, service, name }
}

export const useUserModel = () => {
  const { idField, service, name } = useUsersConfig()

  const Model = useModel(name, () => {
    const modelFn = (data: ModelInstance<User>) => {
      const defaults = {
        email: '',
        password: '',
      }
      const withDefaults = useInstanceDefaults(defaults, data)
      return withDefaults
    }
    return useFeathersModel<User, UserData, UserQuery, typeof modelFn>({ name, idField, service }, modelFn)
  })

  onModelReady(name, () => {
    service.hooks({ around: { all: [...feathersPiniaHooks(Model)] } })
  })
  connectModel(name, () => Model, useUserStore)

  return Model
}
```

```ts [With Import Statements]
import {
  type ModelInstance,
  useModel,
  associateFind,
  feathersPiniaHooks,
  useFeathersModel,
  useInstanceDefaults,
  onModelReady,
  connectModel,
} from 'feathers-pinia'
import { useFeathersPiniaConfig } from '../feathers-pinia-config'
import type { User, UserData, UserQuery } from 'feathers-pinia-api'

export const useUsersConfig = () => {
  const { pinia, idField, whitelist } = useFeathersPiniaConfig()
  const servicePath = 'users'
  const service = useFeathersService<User, UserQuery>(servicePath)
  const name = 'User'

  return { pinia, idField, whitelist, servicePath, service, name }
}

export const useUserModel = () => {
  const { idField, service, name } = useUsersConfig()

  const Model = useModel(name, () => {
    const modelFn = (data: ModelInstance<User>) => {
      const defaults = {
        email: '',
        password: '',
      }
      const withDefaults = useInstanceDefaults(defaults, data)
      return withDefaults
    }
    return useFeathersModel<User, UserData, UserQuery, typeof modelFn>({ name, idField, service }, modelFn)
  })

  onModelReady(name, () => {
    service.hooks({ around: { all: [...feathersPiniaHooks(Model)] } })
  })
  connectModel(name, () => Model, useUserStore)

  return Model
}
```

:::

This code does more than setup the Model. It also

- assures the Model is only created once per request, even if you call `useUserModel` multiple times.
- allows the Model and store to be kept in different folders, keeping Models in `models` and stores in `stores`.
- assures the Model and store are properly connected.
- assures hooks are only registered once.

<BlockQuote type="warning" label="Model.store vs store">

Models have a `store` property that references the pinia store. (We will setup the pinia stores in the next steps) The
current types won't pick up on customizations. This means that for customized stores, you'll need to access them with
their own `useUserStore` or equivalent function.

In this tutorial, `User.store` and `useUserStore()` both hold the same value, but TypeScript doesn't know it, yet.

This limitation will be fixed in a future release.

</BlockQuote>
