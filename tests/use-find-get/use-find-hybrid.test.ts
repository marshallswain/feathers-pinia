import { computed, ref } from 'vue-demi'
import { api, makeContactsDataRandom } from '../fixtures.js'
import { resetService } from '../test-utils.js'

const service = api.service('contacts')

beforeEach(async () => {
  resetService(service)
  service.service.store = makeContactsDataRandom()
})
afterEach(() => resetService(service))

describe('useFind', () => {
  test('limit: 10, skip: 0', async () => {
    const params = computed(() => {
      return { query: { $limit: 10, $skip: 0 } }
    })
    const { data, request } = service.useFind(params, { paginateOn: 'hybrid' })

    await request.value
    expect(data.value.length).toBe(10)
    expect(data.value.map((item: any) => item._id)).toEqual([
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
    ])
  })

  test('limit: 10, skip: 0', async () => {
    const pagination = { limit: ref(10), skip: ref(0) }
    const params = computed(() => {
      return { query: {} }
    })
    const { data, request } = service.useFind(params, {
      paginateOn: 'hybrid',
      pagination,
    })

    await request.value
    expect(data.value.length).toBe(10)
    expect(data.value.map((item: any) => item._id)).toEqual([
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
    ])
  })

  test('limit: 10, skip: 10', async () => {
    const params = computed(() => {
      return { query: { $limit: 10, $skip: 10 } }
    })
    const { data, request } = service.useFind(params, { paginateOn: 'hybrid' })

    await request.value
    expect(data.value.length).toBe(10)
    expect(data.value.map((item: any) => item._id)).toEqual([
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '19',
    ])
  })

  test('limit: 10, skip: 10', async () => {
    const pagination = { limit: ref(10), skip: ref(10) }
    const params = computed(() => {
      return { query: {} }
    })
    const { data, request } = service.useFind(params, {
      paginateOn: 'hybrid',
      pagination,
    })

    await request.value
    expect(data.value.length).toBe(10)
    expect(data.value.map((item: any) => item._id)).toEqual([
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '19',
    ])
  })

  test('limit: 10, skip: 20', async () => {
    const params = computed(() => {
      return { query: { $limit: 10, $skip: 20 } }
    })
    const { data, request } = service.useFind(params, { paginateOn: 'hybrid' })

    await request.value
    expect(data.value.length).toBe(10)
    expect(data.value.map((item: any) => item._id)).toEqual([
      '20',
      '21',
      '22',
      '23',
      '24',
      '25',
      '26',
      '27',
      '28',
      '29',
    ])
  })

  test('limit: 10, skip: 20', async () => {
    const pagination = { limit: ref(10), skip: ref(20) }
    const params = computed(() => {
      return { query: {} }
    })
    const { data, request } = service.useFind(params, {
      paginateOn: 'hybrid',
      pagination,
    })

    await request.value
    expect(data.value.length).toBe(10)
    expect(data.value.map((item: any) => item._id)).toEqual([
      '20',
      '21',
      '22',
      '23',
      '24',
      '25',
      '26',
      '27',
      '28',
      '29',
    ])
  })

  test('limit: 10, skip: 30', async () => {
    const params = computed(() => {
      return { query: { $limit: 10, $skip: 30 } }
    })
    const { data, request } = service.useFind(params, { paginateOn: 'hybrid' })

    await request.value
    expect(data.value.length).toBe(10)
    expect(data.value.map((item: any) => item._id)).toEqual([
      '30',
      '31',
      '32',
      '33',
      '34',
      '35',
      '36',
      '37',
      '38',
      '39',
    ])
  })

  test('paginating from beginning', async () => {
    const params = computed(() => {
      return { query: { $limit: 10, $skip: 0 } }
    })
    const { data, next, prev, request } = service.useFind(params, {
      paginateOn: 'hybrid',
    })

    await request.value
    expect(data.value.length).toBe(10)
    expect(data.value.map((item: any) => item._id)).toEqual([
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
    ])

    await next()

    expect(data.value.map((item: any) => item._id)).toEqual([
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '19',
    ])

    await next()

    expect(data.value.map((item: any) => item._id)).toEqual([
      '20',
      '21',
      '22',
      '23',
      '24',
      '25',
      '26',
      '27',
      '28',
      '29',
    ])

    await prev()

    expect(data.value.map((item: any) => item._id)).toEqual([
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '19',
    ])
  })

  test('paginating from beginning', async () => {
    const pagination = { limit: ref(10), skip: ref(0) }
    const params = computed(() => {
      return { query: {} }
    })
    const { data, next, prev, request } = service.useFind(params, {
      paginateOn: 'hybrid',
      pagination,
    })

    await request.value
    expect(data.value.length).toBe(10)
    expect(data.value.map((item: any) => item._id)).toEqual([
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
    ])

    await next()

    expect(data.value.map((item: any) => item._id)).toEqual([
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '19',
    ])

    await next()

    expect(data.value.map((item: any) => item._id)).toEqual([
      '20',
      '21',
      '22',
      '23',
      '24',
      '25',
      '26',
      '27',
      '28',
      '29',
    ])

    await prev()

    expect(data.value.map((item: any) => item._id)).toEqual([
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '19',
    ])
  })

  test('paginating from middle', async () => {
    const params = computed(() => {
      return { query: { $limit: 10, $skip: 30 } }
    })
    const { data, prev, request } = service.useFind(params, {
      paginateOn: 'hybrid',
    })

    await request.value
    expect(data.value.length).toBe(10)
    expect(data.value.map((item: any) => item._id)).toEqual([
      '30',
      '31',
      '32',
      '33',
      '34',
      '35',
      '36',
      '37',
      '38',
      '39',
    ])

    await prev()

    expect(data.value.map((item: any) => item._id)).toEqual([
      '20',
      '21',
      '22',
      '23',
      '24',
      '25',
      '26',
      '27',
      '28',
      '29',
    ])

    await prev()

    expect(data.value.map((item: any) => item._id)).toEqual([
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '19',
    ])

    await prev()

    expect(data.value.map((item: any) => item._id)).toEqual([
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
    ])
  })

  test('paginating from middle', async () => {
    const pagination = { limit: ref(10), skip: ref(30) }
    const params = computed(() => {
      return { query: {} }
    })
    const { data, prev, request } = service.useFind(params, {
      paginateOn: 'hybrid',
      pagination,
    })

    await request.value
    expect(data.value.length).toBe(10)
    expect(data.value.map((item: any) => item._id)).toEqual([
      '30',
      '31',
      '32',
      '33',
      '34',
      '35',
      '36',
      '37',
      '38',
      '39',
    ])

    await prev()

    expect(data.value.map((item: any) => item._id)).toEqual([
      '20',
      '21',
      '22',
      '23',
      '24',
      '25',
      '26',
      '27',
      '28',
      '29',
    ])

    await prev()

    expect(data.value.map((item: any) => item._id)).toEqual([
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '19',
    ])

    await prev()

    expect(data.value.map((item: any) => item._id)).toEqual([
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
    ])
  })

  test('paginating from middle to middle forwards', async () => {
    const params = computed(() => {
      return { query: { $limit: 10, $skip: 20 } }
    })
    const { data, toPage, currentPage, request } = service.useFind(params, {
      paginateOn: 'hybrid',
    })

    await request.value
    expect(data.value.length).toBe(10)
    expect(data.value.map((item: any) => item._id)).toEqual([
      '20',
      '21',
      '22',
      '23',
      '24',
      '25',
      '26',
      '27',
      '28',
      '29',
    ])

    await toPage(currentPage.value + 2)

    expect(data.value.map((item: any) => item._id)).toEqual([
      '40',
      '41',
      '42',
      '43',
      '44',
      '45',
      '46',
      '47',
      '48',
      '49',
    ])
  })

  test('paginating from middle to middle forwards', async () => {
    const pagination = { limit: ref(10), skip: ref(20) }
    const params = computed(() => {
      return { query: {} }
    })
    const { data, toPage, currentPage, request } = service.useFind(params, {
      paginateOn: 'hybrid',
      pagination,
    })

    await request.value
    expect(data.value.length).toBe(10)
    expect(data.value.map((item: any) => item._id)).toEqual([
      '20',
      '21',
      '22',
      '23',
      '24',
      '25',
      '26',
      '27',
      '28',
      '29',
    ])

    await toPage(currentPage.value + 2)

    expect(data.value.map((item: any) => item._id)).toEqual([
      '40',
      '41',
      '42',
      '43',
      '44',
      '45',
      '46',
      '47',
      '48',
      '49',
    ])
  })

  test('paginating from middle to middle backwards', async () => {
    const params = computed(() => {
      return { query: { $limit: 10, $skip: 40 } }
    })
    const { data, toPage, currentPage, request } = service.useFind(params, {
      paginateOn: 'hybrid',
    })

    await request.value
    expect(data.value.length).toBe(10)
    expect(data.value.map((item: any) => item._id)).toEqual([
      '40',
      '41',
      '42',
      '43',
      '44',
      '45',
      '46',
      '47',
      '48',
      '49',
    ])

    await toPage(currentPage.value - 2)

    expect(data.value.map((item: any) => item._id)).toEqual([
      '20',
      '21',
      '22',
      '23',
      '24',
      '25',
      '26',
      '27',
      '28',
      '29',
    ])
  })

  test('paginating from middle to middle backwards', async () => {
    const pagination = { limit: ref(10), skip: ref(40) }
    const params = computed(() => {
      return { query: {} }
    })
    const { data, toPage, currentPage, request } = service.useFind(params, {
      paginateOn: 'hybrid',
      pagination,
    })

    await request.value
    expect(data.value.length).toBe(10)
    expect(data.value.map((item: any) => item._id)).toEqual([
      '40',
      '41',
      '42',
      '43',
      '44',
      '45',
      '46',
      '47',
      '48',
      '49',
    ])

    await toPage(currentPage.value - 2)

    expect(data.value.map((item: any) => item._id)).toEqual([
      '20',
      '21',
      '22',
      '23',
      '24',
      '25',
      '26',
      '27',
      '28',
      '29',
    ])
  })

  test('live list after first with sort - item appears on the page', async () => {
    const params = computed(() => {
      return { query: { $limit: 10, $skip: 10, $sort: { birthdate: 1 } } }
    })
    const { data, request } = service.useFind(params, { paginateOn: 'hybrid' })

    await request.value
    expect(data.value.length).toBe(10)
    const first = data.value[0]
    const birthdate = first.birthdate + 1
    const copyOfFirst = {
      _id: 100,
      name: 'Steve',
      age: first.age,
      birthdate,
      added: true,
    }

    service.createInStore(copyOfFirst)
    expect(data.value[1]).toEqual(copyOfFirst)
  })

  test('live list after first with sort - item appears on the page', async () => {
    const pagination = { limit: ref(10), skip: ref(10) }
    const params = computed(() => {
      return { query: { $sort: { birthdate: 1 } } }
    })
    const { data, request } = service.useFind(params, {
      paginateOn: 'hybrid',
      pagination,
    })

    await request.value
    expect(data.value.length).toBe(10)
    const first = data.value[0]
    const birthdate = first.birthdate + 1
    const copyOfFirst = {
      _id: 100,
      name: 'Steve',
      age: first.age,
      birthdate,
      added: true,
    }

    service.createInStore(copyOfFirst)
    expect(data.value[1]).toEqual(copyOfFirst)
  })

  test('live list before first with sort - item not present because it fits in the 10-item $skip buffer', async () => {
    const params = computed(() => {
      return { query: { $limit: 10, $skip: 10, $sort: { birthdate: 1 } } }
    })
    const { data, request } = service.useFind(params, { paginateOn: 'hybrid' })

    await request.value
    expect(data.value.length).toBe(10)
    const first = data.value[0]
    const birthdate = first.birthdate - 1
    const copyOfFirst = {
      _id: 100,
      name: 'Steve',
      age: first.age,
      birthdate,
      added: true,
    }

    service.createInStore(copyOfFirst)
    expect(data.value.find((item: any) => item._id === 100)).toBeUndefined()
  })

  test('live list before first with sort - item not present because it fits in the 10-item $skip buffer', async () => {
    const pagination = { limit: ref(10), skip: ref(10) }
    const params = computed(() => {
      return { query: { $sort: { birthdate: 1 } } }
    })
    const { data, request } = service.useFind(params, {
      paginateOn: 'hybrid',
      pagination,
    })

    await request.value
    expect(data.value.length).toBe(10)
    const first = data.value[0]
    const birthdate = first.birthdate - 1
    const copyOfFirst = {
      _id: 100,
      name: 'Steve',
      age: first.age,
      birthdate,
      added: true,
    }

    service.createInStore(copyOfFirst)
    expect(data.value.find((item: any) => item._id === 100)).toBeUndefined()
  })

  test('live list before first with sort - added item moves to top because there is no $skip buffer', async () => {
    const params = computed(() => {
      return { query: { $limit: 10, $skip: 0, $sort: { birthdate: 1 } } }
    })
    const { data, request } = service.useFind(params, { paginateOn: 'hybrid' })

    await request.value
    expect(data.value.length).toBe(10)
    const first = data.value[0]
    const birthdate = first.birthdate - 1
    const copyOfFirst = {
      _id: 100,
      name: 'Steve',
      age: first.age,
      birthdate,
      added: true,
    }

    service.createInStore(copyOfFirst)
    expect(data.value[0]).toEqual(copyOfFirst)
  })

  test('live list before first with sort - added item moves to top because there is no $skip buffer', async () => {
    const pagination = { limit: ref(10), skip: ref(0) }
    const params = computed(() => {
      return { query: { $sort: { birthdate: 1 } } }
    })
    const { data, request } = service.useFind(params, {
      paginateOn: 'hybrid',
      pagination,
    })

    await request.value
    expect(data.value.length).toBe(10)
    const first = data.value[0]
    const birthdate = first.birthdate - 1
    const copyOfFirst = {
      _id: 100,
      name: 'Steve',
      age: first.age,
      birthdate,
      added: true,
    }

    service.createInStore(copyOfFirst)
    expect(data.value[0]).toEqual(copyOfFirst)
  })

  test('live list before first with sort - added item appears in second page after prev and next', async () => {
    const params = computed(() => {
      return { query: { $limit: 10, $skip: 10, $sort: { birthdate: 1 } } }
    })
    const { data, next, prev, request } = service.useFind(params, {
      paginateOn: 'hybrid',
    })

    await request.value
    expect(data.value.length).toBe(10)
    const first = data.value[0]
    const birthdate = first.birthdate - 1
    const copyOfFirst = {
      _id: 100,
      name: 'Steve',
      age: first.age,
      birthdate,
      added: true,
    }

    service.createInStore(copyOfFirst)
    expect(data.value.find((item: any) => item._id === 100)).toBeUndefined()

    await prev()
    expect(data.value.find((item: any) => item._id === 100)).toBeUndefined()

    await next()
    expect(data.value.find((item: any) => item._id === 100)).toEqual(
      copyOfFirst
    )
  })

  test('live list before first with sort - added item appears in second page after prev and next', async () => {
    const pagination = { limit: ref(10), skip: ref(10) }
    const params = computed(() => {
      return { query: { $sort: { birthdate: 1 } } }
    })
    const { data, next, prev, request } = service.useFind(params, {
      paginateOn: 'hybrid',
      pagination,
    })

    await request.value
    expect(data.value.length).toBe(10)
    const first = data.value[0]
    const birthdate = first.birthdate - 1
    const copyOfFirst = {
      _id: 100,
      name: 'Steve',
      age: first.age,
      birthdate,
      added: true,
    }

    service.createInStore(copyOfFirst)
    expect(data.value.find((item: any) => item._id === 100)).toBeUndefined()

    await prev()
    expect(data.value.find((item: any) => item._id === 100)).toBeUndefined()

    await next()
    expect(data.value.find((item: any) => item._id === 100)).toEqual(
      copyOfFirst
    )
  })

  test('live list before first with sort - added item appears in second page after prev and next', async () => {
    const params = computed(() => {
      return { query: { $limit: 10, $skip: 10, $sort: { birthdate: 1 } } }
    })
    const { data, next, prev, request } = service.useFind(params, {
      paginateOn: 'hybrid',
    })

    await request.value
    expect(data.value.length).toBe(10)
    const first = data.value[0]
    const birthdate = first.birthdate - 1
    const copyOfFirst = {
      _id: 100,
      name: 'Steve',
      age: first.age,
      birthdate,
      added: true,
    }

    service.createInStore(copyOfFirst)
    expect(data.value.find((item: any) => item._id === 100)).toBeUndefined()

    await prev()
    expect(data.value.find((item: any) => item._id === 100)).toBeUndefined()

    await next()
    expect(data.value.find((item: any) => item._id === 100)).toEqual(
      copyOfFirst
    )

    service.removeFromStore(100)
    expect(data.value)
    expect(data.value.length).toBe(10)
    expect(data.value.find((item: any) => item._id === 100)).toBeUndefined()
  })

  test('live list before first with sort - added item appears in second page after prev and next', async () => {
    const pagination = { limit: ref(10), skip: ref(10) }
    const params = computed(() => {
      return { query: { $sort: { birthdate: 1 } } }
    })
    const { data, next, prev, request } = service.useFind(params, {
      paginateOn: 'hybrid',
      pagination,
    })

    await request.value
    expect(data.value.length).toBe(10)
    const first = data.value[0]
    const birthdate = first.birthdate - 1
    const copyOfFirst = {
      _id: 100,
      name: 'Steve',
      age: first.age,
      birthdate,
      added: true,
    }

    service.createInStore(copyOfFirst)
    expect(data.value.find((item: any) => item._id === 100)).toBeUndefined()

    await prev()
    expect(data.value.find((item: any) => item._id === 100)).toBeUndefined()

    await next()
    expect(data.value.find((item: any) => item._id === 100)).toEqual(
      copyOfFirst
    )

    service.removeFromStore(100)
    expect(data.value)
    expect(data.value.length).toBe(10)
    expect(data.value.find((item: any) => item._id === 100)).toBeUndefined()
  })
})
