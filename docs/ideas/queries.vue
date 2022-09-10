<script setup lang="ts">
import { reactive, computed } from 'vue-demi'

const user = {
  id: 1,
  name: 'Myriah',
  messages: {
    data: computed(() => [
      { id: 1, text: '🙂', sentById: 1, toId: 2 },
      { id: 3, text: 'Hey', sentById: 1, toId: 2 },
      { id: 5, text: 'Hey what?', sentById: 1, toId: 2 },
      { id: 7, text: '🥐', sentById: 1, toId: 2 },
    ]),
    find: (params: any) => params,
    paginate: reactive({ $limit: 10, $skip: 0 }),
    makeParams: () => {
      return { query: {} }
    },
  },
}
</script>

<!-- User Template -->
<template>
  <div>
    {{ user.name }}

    <FeathersList
      :data="user.messages"
      :params="{
        /* optional */
      }"
    >
      <template #default="{ data: messages, find, next, prev }">
        <ul>
          <Message v-for="message in messages" :key="message.id" :message="message" />
        </ul>
        <button type="button" @click="prev">Prev</button>
        <button type="button" @click="next">Next</button>
        <button type="button" @click="find">Reload</button>
      </template>
    </FeathersList>
  </div>
</template>

<!-- Message Template -->
<template>
  <li>
    {{ message.text }}

    <div>{{message.recipient}}</div>
    <button type="button" @click="user.get">Reload</button>
  </li>
</template>
