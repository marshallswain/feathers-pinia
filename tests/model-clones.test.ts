import { createPinia } from 'pinia'
import { setupFeathersPinia } from '../src/index'
import { api } from './feathers'
import { resetStores } from './test-utils'

const pinia = createPinia()

const { defineStore } = setupFeathersPinia({ clients: { api } })

const servicePath = 'messages'
const useMessagesService = defineStore({ servicePath })

const messagesService = useMessagesService(pinia)

const reset = () => resetStores(api.service('messages'), messagesService)

describe('Model Clones', () => {
  beforeEach(() => reset())
  afterEach(() => reset())

  test('can clone', async () => {
    const message = await messagesService.create({
      text: 'Quick, what is the number to 911?',
    })
    const clone = message.clone({ additionalData: 'a boolean is fine' })
    expect(clone).toHaveProperty('__isClone')
    expect(clone.__isClone).toBe(true)
    expect(message === clone).toBe(false)
    expect(clone).toHaveProperty('additionalData')
    expect(clone.additionalData).toBe('a boolean is fine')
  })

  test('can commit', async () => {
    const message = await messagesService.create({
      text: 'Quick, what is the number to 911?',
    })
    const clone = message.clone()
    clone.foo = 'bar'
    const committed = clone.commit()

    expect(committed.foo).toBe('bar')
    expect(committed.__isClone).toBeUndefined()
  })

  test('can reset', async () => {
    const message = await messagesService.create({
      text: 'Quick, what is the number to 911?',
    })
    const clone = message.clone({ foo: 'bar' })
    const reset = clone.clone()

    expect(reset.foo).toBeUndefined()
    expect(clone === reset).toBeTruthy()
  })

  test('find getter returns clones when params.clones === true', async () => {
    const message = messagesService.addToStore({ _id: 0, text: 'this is a test'});
    const clone = message.clone();
    const data = messagesService.findInStore({ query: {}, clones: true }).data;
    expect(data.length).toBe(1);
    expect(data[0]).toStrictEqual(clone);
  });

  test('find getter does not return clones when params.clones is falsy', async () => {
    const message = messagesService.addToStore({ _id: 0, text: 'this is a test'});
    message.clone();
    const data = messagesService.findInStore({ query: {} }).data;
    expect(data.length).toBe(1);
    expect(data[0]).toStrictEqual(message);
  })

  test('find getter returns existing clones and non clones when params.clones === true', async () => {
    const message1 = messagesService.addToStore({ _id: 0, text: 'this is a test'});
    const message2 = messagesService.addToStore({ _id: 1, text: 'this is a test'});
    const cloneOfMessage1 = message1.clone();
    const data = messagesService.findInStore({ query: { $sort: { id: 1 }}, clones: true }).data;
    expect(data.length).toBe(2);
    expect(data).toStrictEqual([cloneOfMessage1, message2])
  });

  test('get getter returns clone when params.clones === true', async () => {
    const message = messagesService.addToStore({ _id: 0, text: 'this is a test'});
    const clone = message.clone();
    const cloneFromStore = messagesService.getFromStore(0, { clones: true });
    expect(cloneFromStore).toStrictEqual(clone);
  });

  test('get getter does not return clone when params.clones is falsy', async () => {
    const message = messagesService.addToStore({ _id: 0, text: 'this is a test'});
    message.clone();
    const messageFromStore = messagesService.getFromStore(0);
    expect(messageFromStore).toStrictEqual(message);
  });

  test('get getter returns temp clone when params.clones === true', async () => {
    const message = messagesService.addToStore({ text: 'this is a test'});
    const clone = message.clone();
    const cloneFromStore = messagesService.getFromStore(message.__tempId, { clones: true });
    expect(cloneFromStore === clone).toBe(true);
  });

  test('get getter does not return temp clone when params.clones is falsy', async () => {
    const message = messagesService.addToStore({ text: 'this is a test'});
    message.clone();
    const messageFromStore = messagesService.getFromStore(message.__tempId);
    expect(messageFromStore).toStrictEqual(message);
  });
})
