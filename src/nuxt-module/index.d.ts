import { FP } from "./types"

declare module '#app' {
  interface NuxtApp {
    $fp: FP
  }
}
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $fp: FP
  }
}
export { }