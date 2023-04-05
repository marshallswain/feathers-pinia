import { api, makeContactsData } from '../fixtures'
import { resetService } from '../test-utils'

const service = api.service('contacts')

beforeEach(async () => {
  resetService(service)
  service.service.store = makeContactsData()
  await service.find({ query: { $limit: 100 } })
})
afterEach(() => resetService(service))

describe('useFeathersModel', () => {
  test('service.find returns feathers instances', async () => {
    await service.new({ name: 'test' }).save()
    const result = await service.find({ query: {} })
    const [contact] = result.data
    expect(contact.name).toBe('test')
    expect(typeof contact.save).toBe('function')
    expect(typeof contact.create).toBe('function')
    expect(typeof contact.patch).toBe('function')
    expect(typeof contact.remove).toBe('function')
    expect(typeof contact.removeFromStore).toBe('function')
    expect(typeof contact.addToStore).toBe('function')
  })

  test('service.get returns feathers instance', async () => {
    const _contact = await service.new({ name: 'test' }).save()
    const contact = await service.get(_contact._id as string)
    expect(typeof contact.save).toBe('function')
    expect(typeof contact.create).toBe('function')
    expect(typeof contact.patch).toBe('function')
    expect(typeof contact.remove).toBe('function')
    expect(typeof contact.removeFromStore).toBe('function')
    expect(typeof contact.addToStore).toBe('function')
  })

  test('service.create returns feathers instance', async () => {
    const contact = await service.create({ name: 'test' })
    expect(contact.name).toBe('test')
    expect(typeof contact.save).toBe('function')
    expect(typeof contact.create).toBe('function')
    expect(typeof contact.patch).toBe('function')
    expect(typeof contact.remove).toBe('function')
    expect(typeof contact.removeFromStore).toBe('function')
    expect(typeof contact.addToStore).toBe('function')
  })

  test('service.patch returns feathers instance', async () => {
    const _contact = await service.create({ name: 'test1' })
    _contact.name = 'test'
    const contact = await service.patch(_contact._id as string, _contact)
    expect(contact.name).toBe('test')
    expect(typeof contact.save).toBe('function')
    expect(typeof contact.create).toBe('function')
    expect(typeof contact.patch).toBe('function')
    expect(typeof contact.remove).toBe('function')
    expect(typeof contact.removeFromStore).toBe('function')
    expect(typeof contact.addToStore).toBe('function')
  })

  test('service.remove returns feathers instance', async () => {
    const _contact = await service.create({ name: 'test' })
    const contact = await service.remove(_contact._id as string)
    expect(contact.name).toBe('test')
    expect(typeof contact.save).toBe('function')
    expect(typeof contact.create).toBe('function')
    expect(typeof contact.patch).toBe('function')
    expect(typeof contact.remove).toBe('function')
    expect(typeof contact.removeFromStore).toBe('function')
    expect(typeof contact.addToStore).toBe('function')
  })

  test('has new feathers-related methods', async () => {
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
  })

  test('instance.patch', async () => {
    const contact = service.new({ _id: '1' })
    await contact.create()
    contact.name = 'do the dishes'
    const result = await contact.patch()
    expect(result.name).toBe('do the dishes')
    expect(contact.name).toBe('do the dishes')
  })

  test('instance.remove', async () => {
    const contact = service.new({ _id: '1', name: 'test' })
    await contact.create()

    const stored = await api.service('contacts').get('1')
    expect(stored.name).toBe('test')

    await contact.remove()
    try {
      await api.service('contacts').get('1')
    } catch (error) {
      expect(error.message).toBe("No record found for id '1'")
    }
    expect.assertions(2)
  })

  test('service.find', async () => {
    expect(typeof service.find).toBe('function')
  })

  test('service.count', async () => {
    expect(typeof service.count).toBe('function')
  })

  test('service.get', async () => {
    expect(typeof service.get).toBe('function')
  })

  test('service.create', async () => {
    expect(typeof service.create).toBe('function')
  })

  test('service.patch', async () => {
    expect(typeof service.patch).toBe('function')
  })

  test('service.remove', async () => {
    expect(typeof service.remove).toBe('function')
  })

  test('service.findInStore', async () => {
    expect(typeof service.findInStore).toBe('function')
  })

  test('service.countInStore', async () => {
    expect(typeof service.countInStore).toBe('function')
  })

  test('service.getFromStore', async () => {
    expect(typeof service.getFromStore).toBe('function')
  })

  test('service.useFind', async () => {
    expect(typeof service.useFind).toBe('function')
  })
})
