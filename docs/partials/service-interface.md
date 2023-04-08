```ts
const { api } = useFeathers()
const service = api.service('users')

// create data instances
service.new(data)

// api methods
service.find(params)
service.findOne(params) // unique to feathers-pinia
service.count(params)
service.get(id, params)
service.create(id, params)
service.patch(id, params)
service.remove(id, params)

// store methods
service.findInStore(params)
service.findOneInStore(params)
service.countInStore(params)
service.getFromStore(id, params)
service.createInStore(id, params)
service.patchInStore(id, params)
service.removeFromStore(id, params)

// hybrid methods
service.useFind(params, options)
service.useGet(id, options)
service.useGetOnce(id, options)

// event methods
service.on(eventName, eventHandler)
service.emit(eventName, data)
service.removeListener(eventName, eventHandler)
```
