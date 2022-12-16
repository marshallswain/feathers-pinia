import type { Tasks } from '../feathers-schema-tasks'
import { useBaseModel, useInstanceDefaults, type ModelInstance } from '../../src/use-base-model/index'

interface TasksQuery {
  description?: {
    $regex?: string
    $options?: string
  }
}

describe('whitelist', () => {
  test('adds whitelist to the state', async () => {
    const ModelFn = (data: ModelInstance<Tasks>) => {
      const withDefaults = useInstanceDefaults({ isComplete: false }, data)
      return withDefaults
    }
    const Task = useBaseModel<Tasks, TasksQuery, typeof ModelFn>(
      { name: 'Task', idField: '_id', whitelist: ['$regex'] },
      ModelFn,
    )

    expect(Task.store.whitelist[0]).toBe('$regex')
  })

  test('find getter fails without whitelist', async () => {
    const ModelFn = (data: ModelInstance<Tasks>) => {
      const withDefaults = useInstanceDefaults({ isComplete: false }, data)
      return withDefaults
    }
    const Task = useBaseModel<Tasks, TasksQuery, typeof ModelFn>(
      { name: 'Task', idField: '_id', whitelist: [] },
      ModelFn,
    )

    const fn = () => Task.findInStore({ query: { $regex: 'test' } } as any)

    expect(fn).toThrowError()
  })

  /**
   * This is skipped because it's testing operators and not filter. The whitelist only applies to filters.
   */
  test.skip('enables custom query params for the find getter', async () => {
    const ModelFn = (data: ModelInstance<Tasks>) => {
      const withDefaults = useInstanceDefaults({ isComplete: false }, data)
      return withDefaults
    }
    const Task = useBaseModel<Tasks, TasksQuery, typeof ModelFn>(
      { name: 'Task', idField: '_id', whitelist: [] },
      ModelFn,
    )
    Task.addToStore({ _id: '0', description: 'test' })
    Task.addToStore({ _id: '1', description: 'yo!' })

    const { data } = Task.findInStore({ query: { description: { $regex: 'test' } } })

    expect(Array.isArray(data)).toBeTruthy()
    expect(data[0].description).toBe('test')
  })

  /**
   * This is skipped because it's testing operators and not filter. The whitelist only applies to filters.
   */
  test.skip('retrieves custom query params ($options) from the service options', async () => {
    // The $options param is defined on the service in feathers.ts
    const ModelFn = (data: ModelInstance<Tasks>) => {
      const withDefaults = useInstanceDefaults({ isComplete: false }, data)
      return withDefaults
    }
    const Task = useBaseModel<Tasks, TasksQuery, typeof ModelFn>(
      { name: 'Task', idField: '_id', whitelist: [] },
      ModelFn,
    )
    Task.addToStore({ _id: '0', description: 'test' })
    Task.addToStore({ _id: '1', description: 'yo!' })

    const { data } = Task.findInStore({ query: { description: { $regex: 'test', $options: 'igm' } } })

    expect(Array.isArray(data)).toBeTruthy()
  })
})
