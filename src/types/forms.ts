import { z } from 'zod'

export const personSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  middle_name: z.string().nullish(),
  last_name: z.string().nullish(),
  gender: z.enum(['male', 'female', 'other']),
  birth_date: z.string().nullish(),
  death_date: z.string().nullish(),
  is_deceased: z.boolean().default(false),
  is_private: z.boolean().default(false),
  profile_image_url: z.string().nullish(),
  country_of_residence: z.string().nullish(),
  address: z.string().nullish(),
  phone_number: z.string().nullish(),
  email: z.string().nullish(),
})

export type PersonFormData = z.infer<typeof personSchema>

export const relationshipSchema = z.object({
  relationship_type: z.enum(['child', 'sibling', 'spouse', 'parent']),
  person_data: personSchema,
  other_parent_id: z.string().nullish(),
  // Multi-parent support
  add_both_parents: z.boolean().default(false),
  parent2_data: personSchema.partial().extend({
    first_name: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
  }).optional(),
  // Spouse to parent logic
  is_biological_parent: z.boolean().default(false),
  // Marriage Metadata
  marriage_start_date: z.string().nullish(),
  marriage_end_date: z.string().nullish(),
  marriage_status: z.enum(['married', 'divorced', 'widowed', 'separated']).default('married'),
})

export type RelationshipFormData = z.infer<typeof relationshipSchema>
