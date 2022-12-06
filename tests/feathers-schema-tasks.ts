import { Type, querySyntax, type Static } from '@feathersjs/typebox'

// Main data model schema
export const tasksSchema = Type.Object(
  {
    _id: Type.String(),
    description: Type.String(),
    isComplete: Type.Boolean(),
    // userIds: Type.Optional(Type.Array(Type.String())),
  },
  { $id: 'Tasks', additionalProperties: false },
)
export type Tasks = Static<typeof tasksSchema>

// Schema for creating new entries
export const tasksDataSchema = Type.Pick(tasksSchema, ['description'], {
  $id: 'TasksData',
  additionalProperties: false,
})
export type TasksData = Static<typeof tasksDataSchema>

// Schema for allowed query properties
export const tasksQueryProperties = Type.Omit(tasksSchema, [], {
  additionalProperties: false,
})
export const tasksQuerySchema = querySyntax(tasksQueryProperties)
export type TasksQuery = Static<typeof tasksQuerySchema>
