import { Type, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

// Full Schema
export const usersSchema = Type.Object(
  {
    _id: Type.String(),
    email: Type.String(),
    password: Type.Optional(Type.String()),
  },
  { $id: 'Users', additionalProperties: false },
)
export type Users = Static<typeof usersSchema>

// Create
export const usersDataSchema = Type.Pick(usersSchema, ['email', 'password'], {
  $id: 'UsersData',
})
export type UsersData = Static<typeof usersDataSchema>

// Patch
export const usersPatchSchema = Type.Partial(usersDataSchema, {
  $id: 'UsersPatch',
})
export type UsersPatch = Static<typeof usersPatchSchema>

// Query
export const usersQueryProperties = Type.Pick(usersSchema, ['_id', 'email'])
export const usersQuerySchema = Type.Intersect(
  [
    querySyntax(usersQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)
export type UsersQuery = Static<typeof usersQuerySchema>
