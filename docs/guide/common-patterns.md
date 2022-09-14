## Accessing a Store From Hooks

Coming Soon

## Handling Custom Server Responses

Sometimes your server response may contain more attributes than just `data`, `limit`, `skip`, and `sort`.  Maybe your API response include a `summary` field, and you need access to that. You could process this directly in a component, if it's only needed in that one component,  But, if you need it in multiple components, there are better options.

Depending on what you need to do, you may be able to solve this by [accessing the store from hooks](#accessing-a-store-from-hooks).  But that doesn't work if you need reactive data from the store.

To get the data into the store, you can use the [`afterFind` action](./service-stores#afterfindresponse).  Here's what it looks like:

```js
import { defineStore, BaseModel } from '../pinia'

class SpeedingTicket extends BaseModel {
  vin = ''
  plateState = ''

  constructor(data: Partial<SpeedingTicket> = {}) {
    super(data, options)
    this.init(data)
  }
}

const servicePath = 'speeding-tickets'
export const useSpeedingTickets = defineStore({
  servicePath,
  Model: SpeedingTicket,
  actions: {
    afterFind (response: any) {
      if (response.summary) {
        this.handleSummary(response)
      }
    },
    handleSummaryData(response: any) {
      // Handle summary data
    }
  },
})
```

## Reactive Lists with Live Queries

Using Live Queries greatly simplifies app development.  The `find` getter enables this feature.  Here is how you might setup a component to take advantage of Live Queries.  The next example shows how to setup two live-query lists using two getters.

```ts
import { useAppointments } from '../stores/appointments'

const appointmentStore = useAppointments()

// fetch past and future appointments
const params = reactive({ query: {} } })
const { isPending, find } = appointmentStore.useFind(params)

// future appointments
const futureParams = reactive({ query: { date: { $gt: new Date() } } })
const { data: futureAppointments } = appointmentStore.useFind(futureParams)

// past appointments
const pastParams = reactive({ query: { date: { $lt: new Date() } } })
const { data: pastAppointments } = appointmentStore.useFind(pastParams)
```

in the above example of component code, the `future` and `pastAppointments` will automatically update as more data is fetched using the `find` utility.  New items will show up in one of the lists, automatically.  `feathers-pinia` listens to socket events automatically, so you don't have to manually wire any of this up!
