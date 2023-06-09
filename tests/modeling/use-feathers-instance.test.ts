import { api } from '../fixtures.js'
import { resetService, timeout, timeoutHook } from '../test-utils.js'

const service = api.service('contacts')

beforeEach(() => {
  resetService(service)
})

describe('PiniaService', () => {
  test('instances have pending state', async () => {
    const contact = service.new({})
    expect(contact.isSavePending).toBeDefined()
    expect(contact.isCreatePending).toBeDefined()
    expect(contact.isPatchPending).toBeDefined()
    expect(contact.isRemovePending).toBeDefined()
  })

  test('isSavePending with isCreatePending state properly updates', async () => {
    service.hooks({ before: { all: [timeoutHook(20)] } })
    const contact = service.new({})

    const request = contact.save()
    await timeout(0)
    expect(contact.isSavePending).toBeTruthy()
    expect(contact.isCreatePending).toBeTruthy()

    await request
    expect(contact.isSavePending).toBeFalsy()
    expect(contact.isCreatePending).toBeFalsy()
  })

  test('isSavePending with isPatchPending state properly updates', async () => {
    service.hooks({ before: { all: [timeoutHook(20)] } })
    const contact = await service.new({}).save()
    contact.name = 'foo'

    const request = contact.save()
    await timeout(0)
    expect(contact.isSavePending).toBeTruthy()
    expect(contact.isPatchPending).toBeTruthy()

    await request
    expect(contact.isSavePending).toBeFalsy()
    expect(contact.isPatchPending).toBeFalsy()
  })

  test('isRemovePending properly updates', async () => {
    service.hooks({ before: { all: [timeoutHook(20)] } })
    const contact = await service.new({}).save()

    const request = contact.remove()
    await timeout(0)
    expect(contact.isRemovePending).toBeTruthy()

    await request
    expect(contact.isRemovePending).toBeFalsy()
  })

  test('instances have methods', async () => {
    const contact = service.new({})
    expect(typeof contact.save).toBe('function')
    expect(typeof contact.create).toBe('function')
    expect(typeof contact.patch).toBe('function')
    expect(typeof contact.remove).toBe('function')
  })

  test('instance.create', async () => {
    const contact = service.new({ _id: '1' })
    const result = await contact.create()
    expect(result._id).toBe('1')

    expect(service.store.items.length).toBe(1)
  })

  test('instance.patch', async () => {
    const contact = service.new({ _id: '1' })
    expect(contact.name).toEqual('')
    expect(contact.age).toEqual(0)

    await contact.create()

    contact.name = 'do the dishes'

    const result = await contact.patch()
    expect(contact.name).toBe('do the dishes')
    expect(result.name).toBe('do the dishes')
  })

  test('instance.remove', async () => {
    const contact = service.new({ name: 'test' })
    const saved = await contact.save()

    expect(saved._id).toBe(0)
    expect(saved.name).toBe('test')

    const stored = await api.service('contacts').get(0)

    expect(stored.name).toBe('test')

    await contact.remove()

    await expect(api.service('contacts').get(0)).rejects.toThrow(
      "No record found for id '0'"
    )
  })
})
