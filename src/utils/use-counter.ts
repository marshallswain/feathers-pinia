import { ref } from 'vue-demi'

/**
 * Use a counter to track the number of pending queries. Prevents collisions with overlapping queries.
 */
export const useCounter = () => {
  const count = ref(0)
  const add = () => {
    count.value = count.value + 1
  }
  const sub = () => {
    count.value = count.value === 0 ? 0 : count.value - 1
  }
  return { count, add, sub }
}
