import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { PersonFormData, RelationshipFormData } from '@/types/forms'

export function useFamilyMutations() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const addPersonMutation = useMutation({
    mutationFn: async (data: PersonFormData) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: person, error } = await supabase
        .from('persons')
        .insert({
          first_name: data.first_name,
          last_name: data.last_name,
          gender: data.gender,
          birth_date: data.birth_date,
          death_date: data.death_date,
          is_deceased: data.is_deceased,
          creator_uid: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return person
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] })
    },
  })

  const updatePersonMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PersonFormData }) => {
      const { error } = await supabase
        .from('persons')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          gender: data.gender,
          birth_date: data.birth_date,
          death_date: data.death_date,
          is_deceased: data.is_deceased,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] })
    },
  })

  const addRelationshipMutation = useMutation({
    mutationFn: async ({ existingPersonId, data }: { existingPersonId: string; data: RelationshipFormData }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // 1. Create the new person
      const { data: newPerson, error: personError } = await supabase
        .from('persons')
        .insert({
          first_name: data.person_data.first_name,
          last_name: data.person_data.last_name,
          gender: data.person_data.gender,
          birth_date: data.person_data.birth_date,
          creator_uid: user.id,
        })
        .select()
        .single()

      if (personError) throw personError

      // 2. Handle specific relationship logic
      if (data.relationship_type === 'spouse') {
        const [p1, p2] = [existingPersonId, newPerson.id].sort()
        const { error: coupleError } = await supabase
          .from('couples')
          .insert({
            person1_id: p1,
            person2_id: p2,
            relationship_type: 'marriage',
          })
        if (coupleError) throw coupleError
      } else if (data.relationship_type === 'child') {
        // Find or create a couple for the existing person
        // For simplicity, we assume child of existing person and their primary spouse
        const { data: existingCouples } = await supabase
          .from('couples')
          .select('id')
          .or(`person1_id.eq.${existingPersonId},person2_id.eq.${existingPersonId}`)
          .limit(1)

        let coupleId: string

        if (existingCouples && existingCouples.length > 0) {
          coupleId = existingCouples[0].id
        } else {
          // Create a "synthetic" couple if none exists? 
          // Or just a placeholder. For now, we might need a more complex UI to select the other parent.
          throw new Error('Please add a spouse to the parent before adding children.')
        }

        const { error: lineageError } = await supabase
          .from('lineage')
          .insert({
            child_id: newPerson.id,
            couple_id: coupleId,
          })
        if (lineageError) throw lineageError
      }
      
      return newPerson
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] })
      queryClient.invalidateQueries({ queryKey: ['couples'] })
      queryClient.invalidateQueries({ queryKey: ['lineage'] })
    },
  })

  return {
    addPerson: addPersonMutation.mutateAsync,
    updatePerson: updatePersonMutation.mutateAsync,
    addRelationship: addRelationshipMutation.mutateAsync,
    isPending: addPersonMutation.isPending || updatePersonMutation.isPending || addRelationshipMutation.isPending,
  }
}
