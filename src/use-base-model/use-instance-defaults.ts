export const useInstanceDefaults = <T extends Record<string, any>>(
  data: T,
  defaults = {} as Record<string, any>,
  descriptorMap: PropertyDescriptorMap = {}
) => {
  data = Object.assign(defaults, data) as T
  Object.defineProperties(data, descriptorMap)
  return data
}
