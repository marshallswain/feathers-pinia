declare module '*.vue' {
  import { DefineComponent } from 'vue-demi'
  const component: DefineComponent<Record<string, any>, Record<string, any>, any>
  export default component
}
