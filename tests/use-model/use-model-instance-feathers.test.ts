import type { Tasks } from '../feathers-schema-tasks'
import { useInstanceModel, useInstanceFeathers, type BaseModelData } from '../../src/use-base-model/index'
import { api } from '../feathers'

const Task = (data: Partial<Tasks & BaseModelData>) => {
  const withModel = useInstanceModel(data, { name: 'Task', idField: '_id' })
  const withFeathers = useInstanceFeathers(withModel, api.service('tasks'))

  return withFeathers
}

describe('useInstanceFeathers', () => {
  test('has methods', async () => {
    const task = Task({})
    expect(typeof task.save).toBe('function')
    expect(typeof task.create).toBe('function')
    expect(typeof task.patch).toBe('function')
    expect(typeof task.remove).toBe('function')
  })

  test('instance.create', async () => {
    const task = Task({ _id: '1' })
    const result = await task.create()
    expect(result._id).toBe('1')
  })

  test('instance.patch', async () => {
    const task = Task({ _id: '1' })
    await task.create()
    task.description = 'do the dishes'
    const result = await task.patch()
    expect(result.description).toBe('do the dishes')
    expect(task.description).toBe('do the dishes')
  })

  test('instance.remove', async () => {
    const task = Task({ _id: '1', description: 'test' })
    await task.create()

    const stored = await api.service('tasks').get('1')
    expect(stored.description).toBe('test')

    await task.remove()
    try {
      await api.service('tasks').get('1')
    } catch (error) {
      expect(error.message).toBe("No record found for id '1'")
    }
    expect.assertions(2)
  })
})
