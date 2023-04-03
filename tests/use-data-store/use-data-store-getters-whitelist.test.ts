import { api } from '../fixtures'

describe('whitelist', () => {
  test('adds whitelist to the state', async () => {
    expect(api.service('contacts').store.whitelist).toContain('$test')
  })
})
