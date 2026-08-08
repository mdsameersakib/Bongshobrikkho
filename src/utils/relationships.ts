import { Person, Marriage, ParentChild } from '@/types/database'

export function getRelationshipToUser(
  targetPerson: Person,
  userPerson: Person | null,
  allPersons: Person[],
  marriages: Marriage[] = [],
  parentChild: ParentChild[] = []
): string {
  if (!userPerson || !targetPerson || targetPerson.id === userPerson.id) return "You"

  // 1. Direct Relationships
  // Check if target is user's parent
  const userParentIds = parentChild
    .filter(pc => pc.child_id === userPerson.id)
    .map(pc => pc.parent_id)
  
  if (userParentIds.includes(targetPerson.id)) {
    return targetPerson.gender === 'male' ? 'Father' : targetPerson.gender === 'female' ? 'Mother' : 'Parent'
  }

  // Check if target is user's child
  const targetParentIds = parentChild
    .filter(pc => pc.child_id === targetPerson.id)
    .map(pc => pc.parent_id)

  if (targetParentIds.includes(userPerson.id)) {
    return targetPerson.gender === 'male' ? 'Son' : targetPerson.gender === 'female' ? 'Daughter' : 'Child'
  }

  // Check if target is user's spouse
  const marriage = marriages.find(m => 
    (m.person1_id === userPerson.id && m.person2_id === targetPerson.id) ||
    (m.person1_id === targetPerson.id && m.person2_id === userPerson.id)
  )
  if (marriage) {
    const isEx = marriage.status === 'divorced' || marriage.status === 'separated' || marriage.status === 'widowed'
    const prefix = isEx ? (marriage.status === 'widowed' ? 'Late-' : 'Ex-') : ''
    
    if (targetPerson.gender === 'male') return `${prefix}Husband`
    if (targetPerson.gender === 'female') return `${prefix}Wife`
    return `${prefix}Spouse`
  }

  // 1.5 Step-Parents
  // Check if target is married to any of user's parents but is NOT a parent themselves
  const userParentsAreMarriedTo = marriages
    .filter(m => userParentIds.includes(m.person1_id) || userParentIds.includes(m.person2_id))
    .map(m => m.person1_id === targetPerson.id || m.person2_id === targetPerson.id ? targetPerson.id : null)
    .filter(id => id !== null)

  if (userParentsAreMarriedTo.includes(targetPerson.id) && !userParentIds.includes(targetPerson.id)) {
    return targetPerson.gender === 'male' ? 'Step-Father' : targetPerson.gender === 'female' ? 'Step-Mother' : 'Step-Parent'
  }

  // 2. Siblings (Shared at least one parent)
  const sharedParentIds = userParentIds.filter(id => targetParentIds.includes(id))
  
  if (sharedParentIds.length > 0) {
    // Determine if they are "Half" or "Full"
    // They are "Half" only if they BOTH have a different second parent known.
    // If one has a parent the other doesn't, but that person's other parent is "Unknown" in DB,
    // we default to Full Sibling (Brother/Sister) for a better UX.
    
    const userOtherParents = userParentIds.filter(id => !sharedParentIds.includes(id))
    const targetOtherParents = targetParentIds.filter(id => !sharedParentIds.includes(id))
    
    const isConfirmedHalf = userOtherParents.length > 0 && targetOtherParents.length > 0
    
    if (isConfirmedHalf) {
      return targetPerson.gender === 'male' ? 'Half-Brother' : targetPerson.gender === 'female' ? 'Half-Sister' : 'Half-Sibling'
    } else {
      return targetPerson.gender === 'male' ? 'Brother' : targetPerson.gender === 'female' ? 'Sister' : 'Sibling'
    }
  }

  // 3. Extended Relationships
  
  // Grandparents (Parents of my parents)
  const userGrandparentIds = parentChild
    .filter(pc => userParentIds.includes(pc.child_id))
    .map(pc => pc.parent_id)

  if (userGrandparentIds.includes(targetPerson.id)) {
    return targetPerson.gender === 'male' ? 'Grandfather' : targetPerson.gender === 'female' ? 'Grandmother' : 'Grandparent'
  }

  // Uncles / Aunts (Siblings of my parents)
  // We identify them if they share a parent with one of my parents
  const isParentSibling = userParentIds.some(parentId => {
    const parentParentIds = parentChild.filter(pc => pc.child_id === parentId).map(pc => pc.parent_id)
    const targetParentIdsOfTarget = parentChild.filter(pc => pc.child_id === targetPerson.id).map(pc => pc.parent_id)
    return parentParentIds.some(id => targetParentIdsOfTarget.includes(id))
  })

  if (isParentSibling && !userParentIds.includes(targetPerson.id)) {
    return targetPerson.gender === 'male' ? 'Uncle' : targetPerson.gender === 'female' ? 'Aunt' : 'Aunt/Uncle'
  }

  // Cousins (Children of my parent's siblings)
  const isCousin = targetParentIds.some(tParentId => {
    // Check if this parent of target is a sibling of one of my parents
    return userParentIds.some(uParentId => {
      const uGrandparentIds = parentChild.filter(pc => pc.child_id === uParentId).map(pc => pc.parent_id)
      const tGrandparentIds = parentChild.filter(pc => pc.child_id === tParentId).map(pc => pc.parent_id)
      return uGrandparentIds.some(id => tGrandparentIds.includes(id)) && uParentId !== tParentId
    })
  })

  if (isCousin) {
    return "Cousin"
  }

  return "Relative"
}
