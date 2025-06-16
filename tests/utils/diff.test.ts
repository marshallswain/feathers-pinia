import { describe, expect, test } from 'vitest'
import { diff } from '../../src/utils/utils.js'

describe('diff function', () => {
  test('should return entire source object when diffDef is false', () => {
    const original = { id: 1, name: 'John', age: 30 }
    const updated = { id: 1, name: 'Jane', age: 25, city: 'New York' }

    const result = diff(original, updated, false)

    expect(result).toEqual(updated)
  })

  test('should perform normal diffing when diffDef is undefined', () => {
    const original = { id: 1, name: 'John', age: 30 }
    const updated = { id: 1, name: 'Jane', age: 25 }

    const result = diff(original, updated)

    expect(result).toEqual({ name: 'Jane', age: 25 })
  })

  test('should handle diffDef as string', () => {
    const original = { id: 1, name: 'John', age: 30 }
    const updated = { id: 1, name: 'Jane', age: 25 }

    const result = diff(original, updated, 'name')

    expect(result).toEqual({ name: 'Jane' })
  })

  test('should handle diffDef as array', () => {
    const original = { id: 1, name: 'John', age: 30 }
    const updated = { id: 1, name: 'Jane', age: 25 }

    const result = diff(original, updated, ['name'])

    expect(result).toEqual({ name: 'Jane' })
  })

  test('should handle diffDef as object', () => {
    const original = { id: 1, name: 'John', age: 30 }
    const updated = { id: 1, name: 'Jane', age: 25 }

    const result = diff(original, updated, { extraProp: 'test' })

    // When diffDef is an object, it merges with the object keys, not the source
    expect(result).toEqual({ extraProp: 'test' })
  })

  test('should return empty object when no changes', () => {
    const original = { id: 1, name: 'John', age: 30 }
    const updated = { id: 1, name: 'John', age: 30 }

    const result = diff(original, updated)

    expect(result).toEqual({})
  })

  test('should return entire object when no changes with false diffDef', () => {
    const original = { id: 1, name: 'John', age: 30 }
    const updated = { id: 1, name: 'John', age: 30 }

    // Even with false, if objects are identical, return the entire object
    const result = diff(original, updated, false)

    expect(result).toEqual(updated)
  })
})
