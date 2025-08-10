import type { Static } from '@feathersjs/typebox'
import { querySyntax, Type } from '@feathersjs/typebox'

// Full Schema
export const tasksSchema = Type.Object(
  {
    _id: Type.String(),
    description: Type.String(),
    isComplete: Type.Boolean(),
  },
  { $id: 'Tasks', additionalProperties: false },
)
export type Tasks = Static<typeof tasksSchema>

// Create
export const tasksDataSchema = Type.Pick(tasksSchema, ['description', 'isComplete'], {
  $id: 'TasksData',
})
export type TasksData = Static<typeof tasksDataSchema>

// Patch
export const tasksPatchSchema = Type.Partial(tasksDataSchema, {
  $id: 'TasksPatch',
})
export type TasksPatch = Static<typeof tasksPatchSchema>

// Query
export const tasksQueryProperties = Type.Pick(tasksSchema, ['_id', 'description', 'isComplete'])
export const tasksQuerySchema = Type.Intersect(
  [
    querySyntax(tasksQueryProperties),
    // extend properties here
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)
export type TasksQuery = Static<typeof tasksQuerySchema>
