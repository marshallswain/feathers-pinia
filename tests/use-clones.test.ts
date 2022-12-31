import { ModelInstance, useClones, useFeathersModel, useInstanceDefaults } from '../src/index'
import { api } from './feathers'
import { resetStores, timeout } from './test-utils'
import { reactive } from 'vue-demi'
import type { Tasks, TasksData, TasksQuery } from './feathers-schema-tasks'

const service = api.service('tasks')

const modelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({}, data)
  return withDefaults
}
const Task = useFeathersModel<Tasks, TasksData, TasksQuery, typeof modelFn>(
  { name: 'Task', idField: '_id', service },
  modelFn,
)
const reset = () => resetStores(service, Task.store)

describe('useClones', () => {
  beforeEach(() => reset())

  test('it returns clones', async () => {
    const task1 = await Task({ description: 'Say 1' }).save()
    const task2 = await Task({ description: 'Say 2' }).save()

    const props = reactive({ task1, task2 })
    const clones = useClones(props)

    expect(clones.task1.value.__isClone).toBe(true)
    expect(props.task1 === clones.task1.value).toBe(false)

    expect(clones.task2.value.__isClone).toBe(true)
    expect(props.task2 === clones.task2.value).toBe(false)
  })

  test('only clones BaseModel instances', async () => {
    const task1 = await Task({ description: 'Say 1' }).save()

    const props = reactive({ task: task1, booleanField: true })

    const { task, booleanField } = useClones(props)
    expect(task.value.description).toBe('Say 1')
    expect(booleanField.value).toBeNull()
  })

  test('adds new instances to the store', async () => {
    const task1 = await Task({ description: 'Say 1' })
    expect(Task.store.tempIds).toEqual([])

    const props = reactive({ task: task1 })
    useClones(props)

    expect(Task.store.tempIds).toHaveLength(1)
  })

  test('can use deep:true to re-clone when original properties change', async () => {
    const task1 = await Task({ description: 'Say 1' }).save()
    const props = reactive({ task: task1 })

    const { task } = useClones(props, { deep: true })
    expect(task.value?.description).toBe('Say 1')

    Object.assign(task.value, {
      description: 'howdy-edited',
    })

    props.task.description = 'something different'

    // Wait for the watcher to run
    await timeout(10)

    expect(task.value?.description).toBe('something different')
  })

  test('can use useExisting:true to reuse and not overwrite clones', async () => {
    const task1 = await Task({ description: 'Say 1' }).save()
    const props = reactive({ task: task1 })

    const { task } = useClones(props, { useExisting: true })
    expect(task.value?.description).toBe('Say 1')

    Object.assign(task.value, {
      description: 'howdy-edited',
    })

    const { task: task2 } = useClones(props, { useExisting: true })

    // Wait for the watcher to run
    await timeout(10)

    expect(task2.value?.description).toBe('howdy-edited')
  })
})
