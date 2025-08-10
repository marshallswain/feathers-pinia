import { vi } from 'vitest'
import { _ } from '@feathersjs/commons'
import { api, makeContactsData } from '../fixtures/index.js'
import { resetService } from '../test-utils.js'

const service = api.service('contacts')

beforeEach(async () => {
  resetService(service)
  service.service.store = makeContactsData()
})
afterEach(() => resetService(service))

describe('instance patch diffing', () => {
  test('diff by default ', async () => {
    const contact = await service.new({}).save()
    const clone = contact.clone() as any
    clone.name = 'it was the size of texas'
    clone.isComplete = true

    const hook = vi.fn(async (context) => {
      return context
    })
    service.hooks({ before: { patch: [hook] } })

    await clone.save()

    const callData = hook.mock.results[0].value.data
    expect(callData).toEqual({ name: 'it was the size of texas', isComplete: true })
  })

  test('turn diff off with diff:false', async () => {
    const contact = await service.new({}).save()
    const clone = contact.clone()
    clone.name = 'it was the size of texas'

    const hook = vi.fn(context => context)
    service.hooks({ before: { patch: [hook] } })

    await clone.save({ diff: false })

    const callData = hook.mock.results[0].value.data
    // When diff: false, the entire clone object should be sent
    expect(callData).toHaveProperty('name', 'it was the size of texas')
    expect(callData).toHaveProperty('_id', contact._id)
  })

  test('diff string overrides the default diffing algorithm', async () => {
    const contact = await service.new({}).save()
    const clone = contact.clone() as any
    clone.name = 'it was the size of texas'
    clone.isComplete = true

    const hook = vi.fn(context => context)
    service.hooks({ before: { patch: [hook] } })

    await clone.save({ diff: 'name' })

    const callData = hook.mock.results[0].value.data
    expect(callData).toEqual({ name: 'it was the size of texas' })
  })

  test('diff with invalid string produces empty diff, does not send a request', async () => {
    const contact = await service.new({}).save()
    const clone = contact.clone()
    clone.name = 'it was the size of texas'

    const hook = vi.fn(context => context)
    service.hooks({ before: { patch: [hook] } })

    const returned = await clone.save({ diff: 'scooby-doo' })

    expect(returned).toEqual(clone)
    const callData = hook.mock.results[0].value.data
    const result = hook.mock.results[0].value.result
    expect(result._id).toBeDefined()
    expect(callData).toEqual({})
  })

  test('diff array of strings', async () => {
    const contact = await service.new({}).save()
    const clone = contact.clone() as any
    clone.name = 'it was the size of texas'
    clone.test = false
    clone.foo = new Date() // won't get diffed because it's excluded in params.diff

    const hook = vi.fn(context => context)
    service.hooks({ before: { patch: [hook] } })

    await clone.save({ diff: ['name', 'test'] })

    const callData = hook.mock.results[0].value.data
    expect(callData).toEqual({ name: 'it was the size of texas', test: false })
  })

  test('diff array of strings, only one value changes', async () => {
    const contact = await service.new({}).save()
    const clone = contact.clone() as any
    clone.name = 'it was the size of texas'
    clone.test = true
    clone.foo = new Date() // won't get diffed because it's excluded in params.diff

    const hook = vi.fn(context => context)
    service.hooks({ before: { patch: [hook] } })

    await clone.save({ diff: ['name', 'test'] })

    const callData = hook.mock.results[0].value.data
    expect(callData).toEqual({ name: 'it was the size of texas', test: true })
  })

  test('diff with object', async () => {
    const contact = await service.new({}).save()
    const clone = contact.clone() as any
    clone.name = 'it was the size of texas'
    clone.test = false
    clone.foo = new Date() // won't get diffed because it's excluded in params.diff

    const hook = vi.fn(context => context)
    service.hooks({ before: { patch: [hook] } })

    await clone.save({ diff: { name: 'test' } })

    const callData = hook.mock.results[0].value.data
    expect(callData).toEqual({ name: 'test' })
  })

  test('diff and with as string', async () => {
    const contact = await service.new({ test: 'foo' } as any).save()
    const clone = contact.clone()
    clone.name = 'it was the size of texas'

    const hook = vi.fn(context => context)
    service.hooks({ before: { patch: [hook] } })

    await clone.save({ diff: 'name', with: 'test' })

    const callData = hook.mock.results[0].value.data
    expect(callData).toEqual({ name: 'it was the size of texas', test: 'foo' })
  })

  test('diff and with as array', async () => {
    const contact = await service.new({}).save()
    const clone = contact.clone() as any
    clone.name = 'it was the size of texas'
    clone.test = false

    const hook = vi.fn(context => context)
    service.hooks({ before: { patch: [hook] } })

    await clone.save({ diff: 'name', with: ['test'] })

    const callData = hook.mock.results[0].value.data
    expect(callData).toEqual({ name: 'it was the size of texas', test: false })
  })

  test('diff and with as object', async () => {
    const contact = await service.new({}).save()
    const clone = contact.clone() as any
    clone.name = 'it was the size of texas'
    clone.test = true

    const hook = vi.fn(context => context)
    service.hooks({ before: { patch: [hook] } })

    await clone.save({ diff: 'name', with: { test: false } })

    const callData = hook.mock.results[0].value.data
    expect(callData).toEqual({ name: 'it was the size of texas', test: false })
  })

  test('eager updates are reversed if saving fails', async () => {
    const contact = await service.new({ name: 'hi' }).save()
    Object.assign(contact, { test: false })
    const clone = contact.clone()
    clone.name = 'it was the size of texas'

    let hasHookRun = false

    const hook = () => {
      if (!hasHookRun) {
        hasHookRun = true
        throw new Error('fail')
      }
    }
    service.hooks({ before: { patch: [hook] } })

    return clone.save({ diff: 'text', with: 'test' }).catch(() => {
      expect(_.omit(Object.assign({}, contact), '_id')).toEqual({
        name: 'hi',
        test: false,
        age: 0,
      })
    })
  })
})
