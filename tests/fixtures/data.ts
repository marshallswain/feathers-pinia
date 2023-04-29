import { faker } from '@faker-js/faker'

export function makeContactsData() {
  return {
    1: { _id: '1', name: 'Moose', age: 4, birthdate: '2019-03-1T07:00:00.000Z' },
    2: { _id: '2', name: 'moose', age: 5, birthdate: '2018-03-1T07:00:00.000Z' },
    3: { _id: '3', name: 'Goose', age: 6, birthdate: '2017-03-1T07:00:00.000Z' },
    4: { _id: '4', name: 'Loose', age: 5, birthdate: '2018-03-1T07:00:00.000Z' },
    5: { _id: '5', name: 'Marshall', age: 21, birthdate: '2002-03-1T07:00:00.000Z' },
    6: { _id: '6', name: 'David', age: 23, birthdate: '2000-03-1T07:00:00.000Z' },
    7: { _id: '7', name: 'Beau', age: 24, birthdate: '1999-03-1T07:00:00.000Z' },
    8: { _id: '8', name: 'Batman', age: 25, birthdate: '1998-03-1T07:00:00.000Z' },
    9: { _id: '9', name: 'Flash', age: 44, birthdate: '1979-03-1T07:00:00.000Z' },
    10: { _id: '10', name: 'Wolverine', age: 55, birthdate: '1968-03-1T07:00:00.000Z' },
    11: { _id: '11', name: 'Rogue', age: 66, birthdate: '1957-03-1T07:00:00.000Z' },
    12: { _id: '12', name: 'Jubilee', age: 77, birthdate: '1946-03-1T07:00:00.000Z' },
  }
}

export function makeContactsDataRandom(count = 100) {
  const placeholders = Array.from(Array(count).keys())
  const contacts = placeholders.map((item: number) => {
    const _id = item.toString()
    const name = faker.name.fullName()
    const birthdate = new Date(faker.date.birthdate())
    const age = calculateAge(birthdate)

    return { _id, name, age, birthdate: birthdate.getTime() }
  })
  const contactsById = contacts.reduce((acc, contact) => {
    acc[contact._id] = contact
    return acc
  }, {})
  return contactsById
}

function calculateAge(birthday: Date) {
  const ageDifMs = Date.now() - birthday.getTime()
  const ageDate = new Date(ageDifMs)
  return Math.abs(ageDate.getUTCFullYear() - 1970)
}
