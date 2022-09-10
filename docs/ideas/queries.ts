/* eslint-disable @typescript-eslint/no-unused-vars */
import { reactive, computed } from 'vue-demi'

class Message {
  constructor(data: any = {}) {
    return this
  }
}

function findInStore(params: any) {
  return {
    data: [],
    find(_params: any) {
      return store.find(_params || params)
    },
  }
}

const { data: messages, find: findMessages } = user._messages.findInStore({ query: {} })

findMessages()

<li v-for="message in messages" :key="message.id">
  {{ message.text }}
</li>

const user = {
  id: 1,
  name: 'Myriah',
  messages: {
    data: computed(() => [
      { id: 1, text: '🙂', userId: 1 },
      { id: 3, text: 'Hey', userId: 1 },
      { id: 5, text: 'Hey what?', userId: 1 },
      { id: 7, text: '🥐', userId: 1 },
    ]),
    find: (params: any) => params,
    paginate: reactive({ $limit: 10, $skip: 0 }),
    makeParams: () => {
      return { query: {} }
    },
  },
}

const message = new Message({
  id: 1,
  text: '🙂',
  userId: 1,
  user: {
    data: { id: 1, name: 'Myriah', messages: {} },
    get: (id: any, params: any) => ({}),
  },
})

const res = await user.messages.find({ query: {} })
const response = {
  data: [message],
  limit: 10,
  skip: 0,
  total: 120,

  paginate: reactive({ $limit: 10, $skip: 0 }),
  isLoading: false,
  next: () => ({}),
  prev: () => ({}),
}

// user.messages.data[0].user.data.messages.data[0].user.data.messages.data[0]
