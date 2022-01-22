import { createPinia } from 'pinia'
import { setupFeathersPinia } from '../src/index'
import { api } from './feathers'
import { resetStores } from './test-utils'

const pinia = createPinia()

const { defineStore, BaseModel } = setupFeathersPinia({ clients: { api } })

class Message extends BaseModel {}
const useMessagesService = defineStore({ servicePath: 'messages', idField: 'id', Model: Message })
const messagesService = useMessagesService(pinia)

const reset = () => resetStores(api.service('messages'), messagesService)

describe('Lists', () => {
  beforeEach(async () => {
    reset()
    // Manually add some data to the store.
    '......'.split('.').forEach((empty: string, id: number) => {
      messagesService.addToStore({ id, text: 'hydrate me' })
      messagesService.addToStore({ text: `temp message ${id}` })
    })
  })
  afterEach(() => reset())

  test('items getter returns items in itemsById', async () => {
    expect(messagesService.items.length).toBe(7)
  })

  test('itemIds getter returns item ids in itemsById', async () => {
    messagesService.addToStore({ id: "507f1f77bcf86cd799439011", text: 'hydrate me' })
    expect(messagesService.itemIds).toStrictEqual([0, 1, 2, 3, 4, 5, 6, "507f1f77bcf86cd799439011"])
  });

  test('temps getter returns items in tempsById', async () => {
    expect(messagesService.temps.length).toBe(7)
  })

  test('tempIds getter returns temp ids in tempsById', async () => {
    const tempIds = messagesService.temps.map((temp: any) => temp.__tempId);
    expect(messagesService.tempIds).toStrictEqual(tempIds)
  });

  test('clones getter returns clones in clonesById', async () => {
    messagesService.items.forEach((item: any) => item.clone())
    expect(messagesService.clones.length).toBe(7)
  })

  test('cloneIds getter returns clone ids in clonesById', async () => {
    messagesService.items.forEach((item: any) => item.clone())
    expect(messagesService.cloneIds).toStrictEqual([0, 1, 2, 3, 4, 5, 6])
  });

  test('itemsAndTemps getter returns items and temps in itemsById and tempsById', async () => {
    const { items, temps } = messagesService;

    items.forEach((item: any, i: number) => {
      if (i % 2 === 0) { return; }
      item.clone()
    })
    temps.forEach((temp: any, i: number) => {
      if (i % 2 === 0) { return; }
      temp.clone()
    })

    const itemsAndTemps = [...items, ...temps];

    expect(messagesService.itemsAndTemps.length).toBe(14);
    messagesService.itemsAndTemps.forEach((item: any) => {
      expect(item.__isClone).toBe(false);
    });
    expect(messagesService.itemsAndTemps.sort()).toStrictEqual(itemsAndTemps.sort());
  })

  test('itemsAndClones getter returns items and clones in itemsById and clonesById', async () => {
    const { items, temps, clonesById } = messagesService;

    items.forEach((item: any, i: number) => {
      item.i = i;
      if (i % 2 === 0) { return; }
      item.clone()
    })
    temps.forEach((temp: any, i: number) => {
      temp.i = i;
      if (i % 2 === 0) { return; }
      temp.clone()
    })

    const itemsAndClones = items.map((item: any) => clonesById[item.id] || item)

    expect(messagesService.itemsAndClones.length).toBe(7);
    messagesService.itemsAndClones.forEach((item: any) => {
      expect(item).toHaveProperty('__isClone');
      if (item.i % 2 === 0) {
        expect(item.__isClone).toBe(false);
      } else {
        expect(item.__isClone).toBe(true);
      }
    });
    expect(messagesService.itemsAndClones.sort()).toStrictEqual(itemsAndClones.sort());
  })

  test('itemsTempsAndClones getter returns items, temps and clones in itemsById, tempsById and clonesById', async () => {
    const { items, temps, itemsAndTemps, clonesById } = messagesService;

    items.forEach((item: any, i: number) => {
      item.i = i;
      if (i % 2 === 0) { return; }
      item.clone()
    })
    temps.forEach((temp: any, i: number) => {
      temp.i = i;
      if (i % 2 === 0) { return; }
      temp.clone()
    })

    const itemsTempsAndClones = itemsAndTemps.map((item: any) => {
      if (clonesById[item.id]) { return clonesById[item.id] }
      if (item.__isTemp && clonesById[item.__tempId]) { return clonesById[item.__tempId] }
      return item;
    })

    expect(messagesService.itemsTempsAndClones.sort()).toStrictEqual(itemsTempsAndClones.sort());
  })
})
