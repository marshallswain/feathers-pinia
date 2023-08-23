import { type Static, Type, querySyntax } from '@feathersjs/typebox'
import { commentsSchema } from './comments.js'

// Main data model schema
export const postsSchema = Type.Object(
  {
    id: Type.Number(),
    title: Type.String(),
    authorIds: Type.Array(Type.Number()),
    // Associated data
    authors: Type.Optional(Type.Array(Type.Record(Type.String(), Type.Any()))),
    comments: Type.Optional(Type.Array(commentsSchema)),
  },
  { $id: 'Posts', additionalProperties: false },
)
export type Posts = Static<typeof postsSchema>

// Schema for creating new entries
export const postsDataSchema = Type.Pick(postsSchema, ['title', 'authorIds'], {
  $id: 'PostsData',
  additionalProperties: false,
})
export type PostsData = Static<typeof postsDataSchema>

// Schema for allowed query properties
export const postsQueryProperties = Type.Omit(postsSchema, [], {
  additionalProperties: false,
})
export const postsQuerySchema = querySyntax(postsQueryProperties)
export type PostsQuery = Static<typeof postsQuerySchema>
