import { ModelInstance, useClone, useFeathersModel, useInstanceDefaults } from '../src/index'
import { api } from './feathers'
import { resetStores, timeout } from './test-utils'
import { reactive } from 'vue-demi'
import type { Tasks, TasksData, TasksQuery } from './feathers-schema-tasks'

const service = api.service('tasks')

const ModelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({}, data)
  return withDefaults
}
const Task = useFeathersModel<Tasks, TasksData, TasksQuery, typeof ModelFn>(
  { name: 'Task', idField: '_id', service },
  ModelFn,
)
const reset = () => resetStores(service, Task.store)

describe('useClone', () => {
  beforeEach(() => reset())

  test('it returns a clone', async () => {
    const task = await Task({ description: 'Say hi' }).save()
    const props = reactive({ task })
    const clone = useClone(props, 'task')

    expect(clone.value?.__isClone).toBe(true)
    expect(clone.value === props.task).toBe(false)
  })

  test('passing a clone returns a clone', async () => {
    const task = await Task({ description: 'Say hi' }).save()
    const taskClone = task.clone()

    const props = reactive({ task: taskClone })

    const clone = useClone(props, 'task')

    expect(clone.value?.__isClone).toBe(true)
  })

  test('only clones BaseModel instances', async () => {
    const task = await Task({ description: 'Say hi' }).save()
    const props = reactive({ task, booleanField: true })
    const clone = useClone(props, 'booleanField')

    expect(clone.value).toBeNull()
  })

  test('adds new instances to the store upon read', async () => {
    const task = await Task({ description: 'Say hi' })
    const props = reactive({ task })
    const clone = useClone(props, 'task')

    expect(clone.value).toBeDefined() // Must read the value to add to the store
    expect(Task.store.tempIds).toHaveLength(1)
  })

  test('it re-clones if the prop is set to a different instance', async () => {
    const task1 = await Task({ description: 'Say 1' }).save()
    const task2 = await Task({ description: 'Say 2' }).save()
    const props = reactive({ task: task1 })

    const clone = useClone(props, 'task')
    expect(clone.value?.description).toBe('Say 1')

    props.task = task2

    // Wait for the watcher to run
    await timeout(0)
    expect(clone.value?.description).toBe('Say 2')
  })

  test('it does not re-clone if the prop is set to the same instance', async () => {
    const task = await Task({ description: 'Say 1' }).save()
    const props = reactive({ task })

    const clone = useClone(props, 'task')

    // Write some values to the clone
    Object.assign(clone.value as any, {
      description: 'edited',
    })

    props.task = task

    // Wait for the watcher to run
    await timeout(10)

    expect(clone.value?.description).toBe('edited')
  })

  test('does not re-clone if original properties change', async () => {
    const task = await Task({ description: 'Say 1' }).save()
    const props = reactive({ task })

    const clone = useClone(props, 'task')
    expect(clone.value?.description).toBe('Say 1')

    // Write some values to the clone
    Object.assign(clone.value as any, {
      description: 'edited',
    })

    // Change the original
    props.task.description = 'something different'

    // Wait for the watcher to run
    await timeout(20)

    // Clone values did not get reset
    expect(clone.value?.description).toBe('edited')
  })

  test('re-clones if a different record is provided in the props', async () => {
    const task1 = await Task({ description: 'Say 1' }).save()
    const task2 = await Task({ description: 'Say 2' }).save()
    const props = reactive({ task: task1 })

    const clone = useClone(props, 'task')
    expect(clone.value?.description).toBe('Say 1')

    // Write some values to the clone
    Object.assign(clone.value as any, {
      description: 'edited',
      other: 'edited',
    })

    // Change the original
    props.task = task2

    // Wait for the watcher to run
    await timeout(20)

    // Clone values updated to match the new value of prop.task
    expect(clone.value?.description).toBe('Say 2')
    expect(clone.value?.other).toBeUndefined()
  })

  test('can use deep:true to re-clone when original properties change', async () => {
    const task = await Task({ description: 'Say 1' }).save()
    const props = reactive({ task })

    const clone = useClone(props, 'task', { deep: true })
    expect(clone.value?.description).toBe('Say 1')

    task.description = 'something different'

    // Wait for the watcher to run
    await timeout(120)

    expect(clone.value?.description).toBe('something different')
    expect(clone.value?.other).toBeUndefined()
  })

  test('props can initially be null', async () => {
    const task = await Task({ description: 'Say 1' }).save()

    interface Props {
      task: ModelInstance<Tasks> | null
    }
    const props = reactive<Props>({ task: null })

    const clone = useClone(props, 'task')
    expect(clone.value).toBeNull()

    props.task = task

    // Wait for the watcher to run
    await timeout(0)

    expect(clone.value?.description).toBe('Say 1')
  })

  test('props can return to be null', async () => {
    const task = await Task({ description: 'Say 1' }).save()

    interface Props {
      task: ModelInstance<Tasks> | null
    }
    const props = reactive<Props>({ task })

    const clone = useClone(props, 'task')
    expect(clone.value?.description).toBe('Say 1')

    props.task = null

    // Wait for the watcher to run
    await timeout(20)

    expect(clone.value).toBeNull()
  })
})

describe('Simultanous Usage in Separate Components', () => {
  test('without `useExisting` option, second component resets the first', async () => {
    const task = await Task({ description: 'Say 1' }).save()

    interface Props {
      task: ModelInstance<Tasks> | null
    }
    const props = reactive<Props>({ task })
    const clone = useClone(props, 'task')

    // Make changes to the data in the first component
    Object.assign(clone.value as any, {
      description: 'edited',
      other: 'edited',
    })

    // Clone the data in the second component
    const clone2 = useClone(props, 'task')
    expect(clone2.value?.description).toBe('Say 1')
  })

  test('with `useExisting: true`, second component reuses the existing clone', async () => {
    const task = await Task({ description: 'Say 1' }).save()

    interface Props {
      task: ModelInstance<Tasks> | null
    }
    const props = reactive<Props>({ task })
    const clone = useClone(props, 'task')

    // Make changes to the data in the first component
    Object.assign(clone.value as any, {
      description: 'edited',
    })

    // Clone the data in the second component
    const clone2 = useClone(props, 'task', { useExisting: true })
    expect(clone2.value?.description).toBe('edited')
  })
})
