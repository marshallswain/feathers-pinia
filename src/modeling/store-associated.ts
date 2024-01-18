import { defineValues } from '../utils/index.js'

export function storeAssociated(this: any, data: any, config: Record<string, string>) {
  const updatedValues: any = {}
  Object.keys(config).forEach((key) => {
    const related = data[key]
    const servicePath = config[key]
    const service = this.service(servicePath)
    if (!service)
      console.error(`there is no service at path ${servicePath}. Check your storeAssociated config`, data, config)
    if (related && service) {
      const created = service.createInStore(related)
      updatedValues[key] = created
    }
  })

  defineValues(data, updatedValues)
}
