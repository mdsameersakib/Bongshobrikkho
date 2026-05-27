import { Person, Couple, Lineage } from '@/types/database'

export function getRelationshipToUser(
  targetPerson: Person,
  userPerson: Person | null,
  allPersons: Person[],
  couples: Couple[] = [],
  lineages: Lineage[] = []
): string {
  if (!userPerson || !targetPerson || targetPerson.id === userPerson.id) return "You"

  // 1. Direct Relationships
  // Check if target is user's parent
  const userLineage = lineages.filter(l => l.child_id === userPerson.id)
  const userParentCoupleIds = userLineage.map(l => l.couple_id)
  const userParentCouples = couples.filter(c => userParentCoupleIds.includes(c.id))
  const userParentIds = userParentCouples.flatMap(c => [c.person1_id, c.person2_id])
  
  if (userParentIds.includes(targetPerson.id)) {
    return targetPerson.gender === 'male' ? 'Father' : targetPerson.gender === 'female' ? 'Mother' : 'Parent'
  }

  // Check if target is user's child
  const targetLineage = lineages.filter(l => l.child_id === targetPerson.id)
  const targetParentCoupleIds = targetLineage.map(l => l.couple_id)
  const targetParentCouples = couples.filter(c => targetParentCoupleIds.includes(c.id))
  const targetParentIds = targetParentCouples.flatMap(c => [c.person1_id, c.person2_id])

  if (targetParentIds.includes(userPerson.id)) {
    return targetPerson.gender === 'male' ? 'Son' : targetPerson.gender === 'female' ? 'Daughter' : 'Child'
  }

  // Check if target is user's spouse
  const isSpouse = couples.some(c => 
    (c.person1_id === userPerson.id && c.person2_id === targetPerson.id) ||
    (c.person1_id === targetPerson.id && c.person2_id === userPerson.id)
  )
  if (isSpouse) {
    return targetPerson.gender === 'male' ? 'Husband' : targetPerson.gender === 'female' ? 'Wife' : 'Spouse'
  }

  // 2. Siblings (Shared parent couple)
  const sharedParents = userParentCoupleIds.some(id => targetParentCoupleIds.includes(id))
  if (sharedParents) {
    return targetPerson.gender === 'male' ? 'Brother' : targetPerson.gender === 'female' ? 'Sister' : 'Sibling'
  }

  // 3. Grandparents / Grandchildren (Simplified for now)
  // More complex recursive logic could be added here, similar to the original hook.

  return "Relative"
}
