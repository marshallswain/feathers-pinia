import { api } from '../fixtures/index.js'

describe('whitelist', () => {
  it('adds whitelist to the state', async () => {
    expect(api.service('contacts').store.whitelist).toContain('$test')
  })
})
