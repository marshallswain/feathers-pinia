import type { Tasks, TasksQuery } from '../feathers-schema-tasks'
import { useBaseModel, useInstanceDefaults, type ModelInstance } from '../../src/use-base-model/index'

const modelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({ isComplete: false }, data)
  return withDefaults
}
const Task = useBaseModel<Tasks, TasksQuery, typeof modelFn>({ name: 'Task', idField: '_id' }, modelFn)

describe('useModelInstance clones', () => {
  beforeEach(() => {
    Task.store.clearAll()
  })

  test('clone an item', async () => {
    const task = Task({ _id: '1', description: 'test' })
    const cloned = task.clone()
    expect(cloned._id).toBe('1')
    expect(cloned.__isClone).toBe(true)
    expect(cloned.description).toBe('test')
  })

  test('clone a temp keeps the tempId', async () => {
    const task = Task({ description: 'test' })
    expect(task.__tempId).toBeDefined()
    expect(typeof task.clone).toBe('function')
    const cloned = task.clone()
    expect(cloned.__tempId).toBe(task.__tempId)
    expect(cloned.__isClone).toBe(true)
    expect(cloned.description).toBe('test')
  })

  test('clone a non-stored temp adds it to temps with __isClone set to false', () => {
    const task = Task({ description: 'test' })
    task.clone()
    const storedTemp = Task.store.tempsById[task.__tempId as string]
    expect(storedTemp).toBe(task)
    expect(storedTemp.__isClone).toBe(false)
  })

  test('clone values are independent, do not leak into original item', async () => {
    const task = Task({ description: 'test' })

    const cloned = task.clone()
    cloned.isComplete = true
    expect(task.isComplete).toBe(false)
  })

  test('modified clone properties commit to the original item', async () => {
    const task = Task({ description: 'test' })

    const cloned = task.clone()
    cloned.isComplete = true

    const committed = cloned.commit()
    expect(committed.isComplete).toEqual(true)
  })

  test('committing a temp keeps the tempId', async () => {
    const task = Task({ description: 'test' })
    const cloned = task.clone()
    const committed = cloned.commit()
    expect(committed.__isClone).toBe(false)
    expect(committed).toEqual(task)
  })

  test('can re-clone after commit', async () => {
    const task = Task({ description: 'test' })
    const cloned = task.clone()
    const committed = cloned.commit()
    const recloned = committed.clone()
    expect(cloned).toBe(recloned)
  })

  test('calling reset on an original item clones the item', async () => {
    const task = Task({ description: 'test' })
    const resetted = task.reset()

    const storedClone = Task.store.clonesById[task.__tempId]
    expect(storedClone).toBe(resetted)
  })

  test('calling reset on a clone resets the clone', async () => {
    const task = Task({ description: 'test' })
    const clone = task.clone()
    clone.description = 'foo'

    const resetted = clone.reset()
    expect(clone).toBe(resetted)
    expect(resetted.description).toBe('test')
  })
})
