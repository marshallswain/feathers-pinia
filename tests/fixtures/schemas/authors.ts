import type { Static } from '@feathersjs/typebox'
import { querySyntax, Type } from '@feathersjs/typebox'

// Main data model schema
export const authorsSchema = Type.Object(
  {
    id: Type.Number(),
    name: Type.String({ description: 'The author\'s name' }),
    /**
     * We define relationship data here only if we want to be able to create new instances with related data. This
     * scenario is the same as pre-populating data on the API server and sending it to the client.
     */
    posts: Type.Optional(Type.Any()),
    comments: Type.Optional(Type.Any()),
  },
  { $id: 'Authors', additionalProperties: false },
)
export type Authors = Static<typeof authorsSchema>

// Schema for creating new entries
export const authorsDataSchema = Type.Pick(authorsSchema, ['name', 'posts', 'comments'], {
  $id: 'AuthorsData',
  additionalProperties: false,
})
export type AuthorsData = Static<typeof authorsDataSchema>

// Schema for allowed query properties
export const authorsQueryProperties = Type.Omit(authorsSchema, [], {
  additionalProperties: false,
})
export const authorsQuerySchema = querySyntax(authorsQueryProperties)
export type AuthorsQuery = Static<typeof authorsQuerySchema>
