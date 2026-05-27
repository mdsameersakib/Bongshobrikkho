import { z } from 'zod'

export const personSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  birth_date: z.string().optional().nullable(),
  death_date: z.string().optional().nullable(),
  is_deceased: z.boolean().default(false),
  profile_image_url: z.string().optional().nullable(),
})

export type PersonFormData = z.infer<typeof personSchema>

export const relationshipSchema = z.object({
  relationship_type: z.enum(['child', 'sibling', 'spouse']),
  person_data: personSchema,
})

export type RelationshipFormData = z.infer<typeof relationshipSchema>
