import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { PersonFormData, RelationshipFormData } from '@/types/forms'

export function useFamilyMutations() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const requireSuccess = ({ error }: { error: unknown }) => {
    if (error) throw error
  }

  const addPersonMutation = useMutation({
    mutationFn: async (data: PersonFormData) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: person, error } = await supabase
        .from('persons')
        .insert({
          first_name: data.first_name,
          middle_name: data.middle_name || null,
          last_name: data.last_name || null,
          gender: data.gender || null,
          birth_date: data.birth_date || null,
          death_date: data.death_date || null,
          is_deceased: data.is_deceased,
          is_private: data.is_private || false,
          country_of_residence: data.country_of_residence || null,
          address: data.address || null,
          phone_number: data.phone_number || null,
          email: data.email || null,
          owner_uid: user.id,
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
          middle_name: data.middle_name || null,
          last_name: data.last_name || null,
          gender: data.gender || null,
          birth_date: data.birth_date || null,
          death_date: data.death_date || null,
          is_deceased: data.is_deceased,
          is_private: data.is_private || false,
          country_of_residence: data.country_of_residence || null,
          address: data.address || null,
          phone_number: data.phone_number || null,
          email: data.email || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] })
    },
  })

  const deletePersonMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('persons')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] })
      queryClient.invalidateQueries({ queryKey: ['marriages'] })
      queryClient.invalidateQueries({ queryKey: ['parent_child'] })
    },
  })

  const addRelationshipMutation = useMutation({
    mutationFn: async ({ existingPersonId, data }: { existingPersonId: string; data: RelationshipFormData }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const createPerson = async (pData: PersonFormData) => {
        const { data: p, error } = await supabase
          .from('persons')
          .insert({
            first_name: pData.first_name,
            middle_name: pData.middle_name || null,
            last_name: pData.last_name || null,
            gender: pData.gender || null,
            birth_date: pData.birth_date || null,
            is_private: pData.is_private || false,
            country_of_residence: pData.country_of_residence || null,
            owner_uid: user.id,
          })
          .select()
          .single()
        if (error) throw error
        return p
      }

      // 1. Create the primary person
      const newPerson = await createPerson(data.person_data)

      // 2. Handle specific relationship logic
      if (data.relationship_type === 'spouse') {
        // Create Marriage
        const { error: marriageError } = await supabase
          .from('marriages')
          .insert({
            person1_id: existingPersonId < newPerson.id ? existingPersonId : newPerson.id,
            person2_id: existingPersonId < newPerson.id ? newPerson.id : existingPersonId,
            start_date: data.marriage_start_date || null,
            end_date: data.marriage_end_date || null,
            status: data.marriage_status || 'married',
          })
        if (marriageError) throw marriageError

        // If 'is_biological_parent' is checked, also link the new spouse as a parent of the USER
        // (assuming existingPerson is a parent of the user)
        if (data.is_biological_parent) {
          // Find the user's person record
          const { data: profile } = await supabase.from('profiles').select('person_id').eq('id', user.id).single()
          if (profile?.person_id) {
          requireSuccess(await supabase.from('parent_child').insert({ parent_id: newPerson.id, child_id: profile.person_id }))
          }
        }
      } else if (data.relationship_type === 'child') {
        // Link to existing person as parent
        requireSuccess(await supabase.from('parent_child').insert({ parent_id: existingPersonId, child_id: newPerson.id }))

        // Link to other parent if provided
        if (data.other_parent_id) {
          requireSuccess(await supabase.from('parent_child').insert({ parent_id: data.other_parent_id, child_id: newPerson.id }))
        }
      } else if (data.relationship_type === 'parent') {
        // Link existing person as child of new person
        requireSuccess(await supabase.from('parent_child').insert({ parent_id: newPerson.id, child_id: existingPersonId }))

        // Check if adding both parents
        if (data.add_both_parents && data.parent2_data) {
          const p2Data = data.parent2_data
          const parent2 = await createPerson({
            first_name: p2Data.first_name || 'Parent',
            gender: p2Data.gender || 'female',
            is_deceased: p2Data.is_deceased || false,
            is_private: p2Data.is_private || false,
            ...p2Data
          })
          // Link existing person as child of parent 2
          requireSuccess(await supabase.from('parent_child').insert({ parent_id: parent2.id, child_id: existingPersonId }))
          // Link the two parents as married
          requireSuccess(await supabase.from('marriages').insert({
            person1_id: newPerson.id < parent2.id ? newPerson.id : parent2.id,
            person2_id: newPerson.id < parent2.id ? parent2.id : newPerson.id,
            start_date: data.marriage_start_date || null,
            status: 'married'
          }))
        }
      } else if (data.relationship_type === 'sibling') {
        // Find parents of existing person
        const { data: parents } = await supabase
          .from('parent_child')
          .select('parent_id')
          .eq('child_id', existingPersonId)

        if (parents && parents.length > 0) {
          const pcLinks = parents.map(p => ({
            parent_id: p.parent_id,
            child_id: newPerson.id
          }))
          requireSuccess(await supabase.from('parent_child').insert(pcLinks))
        }
      }
      
      return newPerson
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] })
      queryClient.invalidateQueries({ queryKey: ['marriages'] })
      queryClient.invalidateQueries({ queryKey: ['parent_child'] })
    },
  })

  return {
    addPerson: addPersonMutation.mutateAsync,
    updatePerson: updatePersonMutation.mutateAsync,
    deletePerson: deletePersonMutation.mutateAsync,
    addRelationship: addRelationshipMutation.mutateAsync,
    isPending: addPersonMutation.isPending || updatePersonMutation.isPending || deletePersonMutation.isPending || addRelationshipMutation.isPending,
  }
}
