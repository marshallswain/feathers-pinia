import { Type, querySyntax, type Static } from '@feathersjs/typebox'

// Main data model schema
export const usersSchema = Type.Object(
  {
    _id: Type.String(),
    email: Type.String(),
    password: Type.String(),
    // userIds: Type.Optional(Type.Array(Type.String())),
  },
  { $id: 'Users', additionalProperties: false },
)
export type Users = Static<typeof usersSchema>

// Schema for creating new entries
export const usersDataSchema = Type.Pick(usersSchema, ['email', 'password'], {
  $id: 'UsersData',
  additionalProperties: false,
})
export type UsersData = Static<typeof usersDataSchema>

// Schema for allowed query properties
export const usersQueryProperties = Type.Omit(usersSchema, [], {
  additionalProperties: false,
})
export const usersQuerySchema = querySyntax(usersQueryProperties)
export type UsersQuery = Static<typeof usersQuerySchema>
