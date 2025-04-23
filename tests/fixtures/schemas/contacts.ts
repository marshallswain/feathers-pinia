import type { Static } from '@feathersjs/typebox'
import { querySyntax, Type } from '@feathersjs/typebox'

// Full Schema
export const contactsSchema = Type.Object(
  {
    _id: Type.String(),
    name: Type.String(),
    age: Type.Optional(Type.Number()),
  },
  { $id: 'Contacts', additionalProperties: false },
)
export type Contacts = Static<typeof contactsSchema>

// Create
export const contactsDataSchema = Type.Pick(contactsSchema, ['name', 'age'], {
  $id: 'ContactsData',
})
export type ContactsData = Static<typeof contactsDataSchema>

// Patch
export const contactsPatchSchema = Type.Partial(contactsDataSchema, {
  $id: 'ContactsPatch',
})
export type ContactsPatch = Static<typeof contactsPatchSchema>

// Query
export const contactsQueryProperties = Type.Pick(contactsSchema, ['_id', 'name', 'age'])
export const contactsQuerySchema = Type.Intersect(
  [
    querySyntax(contactsQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)
export type ContactsQuery = Static<typeof contactsQuerySchema>
