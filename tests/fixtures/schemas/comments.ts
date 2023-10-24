import { type Static, Type, querySyntax } from '@feathersjs/typebox'

// Main data model schema
export const commentsSchema = Type.Object(
  {
    id: Type.Number(),
    text: Type.String(),
    authorId: Type.Number(),
    postId: Type.Number(),
    // populated
    author: Type.Optional(Type.Any()),
  },
  { $id: 'Comments', additionalProperties: false },
)
export type Comments = Static<typeof commentsSchema>

// Schema for creating new entries
export const commentsDataSchema = Type.Pick(commentsSchema, ['text', 'authorId', 'postId'], {
  $id: 'CommentsData',
  additionalProperties: false,
})
export type CommentsData = Static<typeof commentsDataSchema>

// Schema for allowed query properties
export const commentsQueryProperties = Type.Omit(commentsSchema, [], {
  additionalProperties: false,
})
export const commentsQuerySchema = querySyntax(commentsQueryProperties)
export type CommentsQuery = Static<typeof commentsQuerySchema>
