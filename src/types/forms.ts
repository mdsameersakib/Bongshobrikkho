import { z } from 'zod'

export const personSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().nullish(),
  gender: z.enum(['male', 'female', 'other']).nullish(),
  birth_date: z.string().nullish(),
  death_date: z.string().nullish(),
  is_deceased: z.boolean(),
  profile_image_url: z.string().nullish(),
})

export type PersonFormData = z.infer<typeof personSchema>

export const relationshipSchema = z.object({
  relationship_type: z.enum(['child', 'sibling', 'spouse']),
  person_data: personSchema,
})

export type RelationshipFormData = z.infer<typeof relationshipSchema>
