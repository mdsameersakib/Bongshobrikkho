import TreeCanvas from '@/components/TreeCanvas'
import { createClient } from '@/lib/supabase-server'

export default async function FamilyTreePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // In a real scenario, we'd fetch the profile to get the linked person_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('person_id')
    .eq('id', user?.id || '')
    .single()

  return (
    <div className="h-full w-full rounded-2xl border border-sand/30 dark:border-sand/10 overflow-hidden shadow-xl bg-white/50 dark:bg-surface-alt backdrop-blur-sm">
      <TreeCanvas userPersonId={profile?.person_id || null} />
    </div>
  )
}
