import type { Tasks, TasksData, TasksQuery } from '../feathers-schema-tasks'
import { type ModelInstance, useFeathersModel, useInstanceDefaults, feathersPiniaHooks } from '../../src'
import { api } from '../feathers'
import { vi } from 'vitest'
import { _ } from '@feathersjs/commons/lib'

const service = api.service('tasks')

const ModelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({ test: true, foo: new Date(), description: 'default' }, data)
  return withDefaults
}
const Task = useFeathersModel<Tasks, TasksData, TasksQuery, typeof ModelFn>(
  { name: 'Task', idField: '_id', service },
  ModelFn,
)

api.service('tasks').hooks({
  around: {
    all: [...feathersPiniaHooks(Task)],
  },
})

describe('instance patch diffing', () => {
  beforeEach(() => {
    Task.store.clearAll()
  })

  test('diff by default ', async () => {
    const task = await Task({}).save()
    const clone = task.clone()
    clone.description = 'it was the size of texas'
    clone.isComplete = true

    const hook: any = vi.fn(async (context) => {
      return context
    })
    service.hooks({ before: { patch: [hook] } })

    await clone.save()

    const callData = hook.returns[0].data
    expect(callData).toEqual({ description: 'it was the size of texas', isComplete: true })
  })

  test('turn diff off with diff:false', async () => {
    const task = await Task({}).save()
    const clone = task.clone()
    clone.description = 'it was the size of texas'

    const hook: any = vi.fn((context) => context)
    service.hooks({ before: { patch: [hook] } })

    await clone.save({ diff: false })

    const callData = hook.returns[0].data
    expect(_.omit(callData, '_id')).toEqual(
      _.omit({ _id: 0, description: 'it was the size of texas', foo: task.foo, test: true }, '_id'),
    )
  })

  test('diff string overrides the default diffing algorithm', async () => {
    const task = await Task({}).save()
    const clone = task.clone()
    clone.description = 'it was the size of texas'
    clone.isComplete = true

    const hook: any = vi.fn((context) => context)
    service.hooks({ before: { patch: [hook] } })

    await clone.save({ diff: 'description' })

    const callData = hook.returns[0].data
    expect(callData).toEqual({ description: 'it was the size of texas' })
  })

  test('diff with invalid string produces empty diff, does not send a request', async () => {
    const task = await Task({}).save()
    const clone = task.clone()
    clone.description = 'it was the size of texas'

    const hook: any = vi.fn((context) => context)
    service.hooks({ before: { patch: [hook] } })

    const returned = await clone.save({ diff: 'scooby-doo' })

    expect(returned).toEqual(clone)
    const callData = hook.returns[0].data
    const result = hook.returns[0].result
    expect(result._id).toBeDefined()
    expect(callData).toEqual({})
  })

  test('diff array of strings', async () => {
    const task = await Task({}).save()
    const clone = task.clone()
    clone.description = 'it was the size of texas'
    clone.test = false
    clone.foo = new Date() // won't get diffed because it's excluded in params.diff

    const hook: any = vi.fn((context) => context)
    service.hooks({ before: { patch: [hook] } })

    await clone.save({ diff: ['description', 'test'] })

    const callData = hook.returns[0].data
    expect(callData).toEqual({ description: 'it was the size of texas', test: false })
  })

  test('diff array of strings, only one value changes', async () => {
    const task = await Task({}).save()
    const clone = task.clone()
    clone.description = 'it was the size of texas'
    clone.test = true
    clone.foo = new Date() // won't get diffed because it's excluded in params.diff

    const hook: any = vi.fn((context) => context)
    service.hooks({ before: { patch: [hook] } })

    await clone.save({ diff: ['description', 'test'] })

    const callData = hook.returns[0].data
    expect(callData).toEqual({ description: 'it was the size of texas' })
  })

  test('diff with object', async () => {
    const task = await Task({}).save()
    const clone = task.clone()
    clone.description = 'it was the size of texas'
    clone.test = false
    clone.foo = new Date() // won't get diffed because it's excluded in params.diff

    const hook: any = vi.fn((context) => context)
    service.hooks({ before: { patch: [hook] } })

    await clone.save({ diff: { description: 'test' } })

    const callData = hook.returns[0].data
    expect(callData).toEqual({ description: 'test' })
  })

  test('diff and with as string', async () => {
    const task = await Task({}).save()
    const clone = task.clone()
    clone.description = 'it was the size of texas'

    const hook: any = vi.fn((context) => context)
    service.hooks({ before: { patch: [hook] } })

    await clone.save({ diff: 'description', with: 'test' })

    const callData = hook.returns[0].data
    expect(callData).toEqual({ description: 'it was the size of texas', test: true })
  })

  test('diff and with as array', async () => {
    const task = await Task({}).save()
    const clone = task.clone()
    clone.description = 'it was the size of texas'
    clone.test = false

    const hook: any = vi.fn((context) => context)
    service.hooks({ before: { patch: [hook] } })

    await clone.save({ diff: 'description', with: ['test'] })

    const callData = hook.returns[0].data
    expect(callData).toEqual({ description: 'it was the size of texas', test: false })
  })

  test('diff and with as object', async () => {
    const task = await Task({}).save()
    const clone = task.clone()
    clone.description = 'it was the size of texas'
    clone.test = true

    const hook: any = vi.fn((context) => context)
    service.hooks({ before: { patch: [hook] } })

    await clone.save({ diff: 'description', with: { test: false } })

    const callData = hook.returns[0].data
    expect(callData).toEqual({ description: 'it was the size of texas', test: false })
  })

  test('eager updates are reversed if saving fails', async () => {
    const task = await Task({ description: 'hi' }).save()
    Object.assign(task, { test: false })
    const clone = task.clone()
    clone.description = 'it was the size of texas'

    let hasHookRun = false

    const hook = () => {
      if (!hasHookRun) {
        hasHookRun = true
        throw new Error('fail')
      }
    }
    service.hooks({ before: { patch: [hook] } })

    return clone.save({ diff: 'text', with: 'test' }).catch(() => {
      expect(_.omit(Object.assign({}, task), '_id')).toEqual({
        description: 'hi',
        test: false,
        foo: task.foo,
      })
    })
  })
})
