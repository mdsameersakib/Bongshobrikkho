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
    <div className="h-[calc(100vh-120px)] w-full rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <TreeCanvas userPersonId={profile?.person_id || null} />
    </div>
  )
}
