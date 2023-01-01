import type { FP } from '../types'
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin(() => {
  const fp: FP = { models: {} }
  return { provide: { fp } }
})
