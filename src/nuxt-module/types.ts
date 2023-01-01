export interface ModelNamespace {
  model: any
  store: any
  ready: boolean
  final: boolean
}
export interface FP {
  models: Record<string, ModelNamespace>
}
