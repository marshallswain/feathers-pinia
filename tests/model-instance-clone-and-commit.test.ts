import { createPinia } from 'pinia'
import { setupFeathersPinia } from '../src/index'
import { api } from './feathers'

const pinia = createPinia()

const { defineStore, BaseModel } = setupFeathersPinia({ clients: { api } })

class Message extends BaseModel {
  id: string
  foo: any
  additionalData: any

  get baz() {
    return 'baz'
  }
}

const servicePath = 'messages'
const useMessagesService = defineStore({ servicePath, Model: Message })

const messagesService = useMessagesService(pinia)

describe('Clone & Commit', () => {
  //
  test('can clone ', async () => {
    const message = await messagesService.create({
      text: 'Quick, what is the number to 911?',
    })
    const clone = message.clone({ additionalData: 'a boolean is fine' })
    expect(clone).toHaveProperty('__isClone')
    expect(clone.__isClone).toBe(true)
    expect(message === clone).toBe(false)
    expect(clone).toHaveProperty('additionalData')
    expect(clone.baz).toBe('baz')
    expect(clone.additionalData).toBe('a boolean is fine')
  })

  test('can commit ', async () => {
    const message = await messagesService.create({
      text: 'Quick, what is the number to 911?',
    })
    const clone = message.clone()
    clone.foo = 'bar'
    const committed = clone.commit()

    expect(committed.foo).toBe('bar')
    expect(committed.baz).toBe('baz')
    expect(committed.__isClone).toBeUndefined()
  })

  test('resetting an original gives you a clone', async () => {
    const message = await messagesService.create({
      text: 'Quick, what is the number to 911?',
    })
    const clone = message.reset({ foo: 'bar' })

    expect(clone.foo).toBe('bar')
    expect(clone.__isClone).toBeTruthy()
  })

  test('items and clones point to values in store', async () => {
    const item = await messagesService.create({
      id: 5,
      text: 'Quick, what is the number to 911?',
    })
    const itemInStore = messagesService.itemsById[item.id]
    expect(item).toEqual(itemInStore)

    const clone = item.clone()
    const cloneInStore = messagesService.clonesById[clone.id]
    expect(clone).toEqual(cloneInStore)
  })

  describe('saving clones', () => {
    test('saving a clone gives back a fresh clone', async () => {
      const item = await messagesService.create({
        id: 5,
        text: 'Quick, what is the number to 911?',
      })

      const clone = item.clone()
      expect(clone.__isClone).toBe(true)

      const savedClone = await clone.save()
      const cloneInStore = messagesService.clonesById[clone.id]

      expect(savedClone.__isClone).toBe(true)
      expect(savedClone).toEqual(cloneInStore)
    })

    test('calling .create() on a clone gives back a fresh clone', async () => {
      const item = new Message({
        id: 5,
        text: 'Quick, what is the number to 911?',
      })

      const clone = item.clone()
      expect(clone.__isClone).toBe(true)

      const savedClone = await clone.create()
      const cloneInStore = messagesService.clonesById[clone.id]

      expect(savedClone.__isClone).toBe(true)
      expect(savedClone).toEqual(cloneInStore)
    })

    test('calling .patch() on a clone gives back a fresh clone', async () => {
      const item = new Message({
        id: 5,
        text: 'Quick, what is the number to 911?',
      })

      const clone = item.clone()
      expect(clone.__isClone).toBe(true)

      const savedClone = await clone.patch()
      const cloneInStore = messagesService.clonesById[clone.id]

      expect(savedClone.__isClone).toBe(true)
      expect(savedClone).toEqual(cloneInStore)
    })

    test('calling .update() on a clone gives back a fresh clone', async () => {
      const item = new Message({
        id: 5,
        text: 'Quick, what is the number to 911?',
      })

      const clone = item.clone()
      expect(clone.__isClone).toBe(true)

      const savedClone = await clone.update()
      const cloneInStore = messagesService.clonesById[clone.id]

      expect(savedClone.__isClone).toBe(true)
      expect(savedClone).toEqual(cloneInStore)
    })
  })
})
