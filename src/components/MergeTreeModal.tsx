'use client'

import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { Person } from '@/types/database'
import { getFullName } from '@/utils/name'
import { useMergeMutations } from '@/hooks/useMergeData'
import { QueryError } from '@/components/QueryState'

export default function MergeTreeModal({ targetUid, persons, onClose }: { targetUid: string; persons: Person[]; onClose: () => void }) {
  const { createSession, updateConflict, executeMerge, isPending } = useMergeMutations()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [conflicts, setConflicts] = useState<Array<{ id: string; a: Person; b: Person; resolution: string }>>([])
  const [error, setError] = useState<string | null>(null)

  const candidates = useMemo(() => {
    const groups = new Map<string, Person[]>()
    persons.forEach(person => { const key = `${getFullName(person).toLowerCase()}|${person.birth_date || ''}`; groups.set(key, [...(groups.get(key) || []), person]) })
    return [...groups.values()].filter(group => group.length > 1).flatMap(group => group.slice(0, 1).flatMap(a => group.slice(1).map(b => ({ a, b }))))
  }, [persons])

  const start = async () => {
    try {
      setError(null)
      const result = await createSession({ target_uid: targetUid, conflicts: candidates.map(({ a, b }) => ({ node_a_id: a.id, node_b_id: b.id })) })
      setSessionId(result.session.id)
      setConflicts(result.conflicts.map(conflict => ({ id: conflict.id, a: persons.find(p => p.id === conflict.node_a_id)!, b: persons.find(p => p.id === conflict.node_b_id)!, resolution: conflict.resolution_status || 'keep_both_as_separate' })))
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to start the merge.') }
  }

  const resolve = async (id: string, resolution: string) => {
    setConflicts(current => current.map(conflict => conflict.id === id ? { ...conflict, resolution } : conflict))
    try { await updateConflict({ id, resolution_status: resolution }) } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save the conflict resolution.') }
  }

  const finish = async () => {
    if (!sessionId) return
    try { await executeMerge(sessionId); onClose() } catch (err) { setError(err instanceof Error ? err.message : 'Unable to complete the merge.') }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-surface p-8 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-2xl font-black text-forest dark:text-sage">Merge Family Trees</h2><button type="button" onClick={onClose}><X /></button></div>{error && <div className="mt-5"><QueryError error={new Error(error)} /></div>}{!sessionId ? <><p className="mt-5 text-sm text-slate-500">Potential duplicates are matched by normalized name and birth date. Nothing is changed until you confirm.</p><p className="mt-3 font-bold">{candidates.length} potential conflict{candidates.length === 1 ? '' : 's'} found.</p><button type="button" onClick={start} disabled={isPending} className="mt-6 w-full rounded-xl bg-forest py-3 font-black text-cream disabled:opacity-50">{isPending ? 'STARTING...' : 'START REVIEW'}</button></> : <><div className="mt-6 space-y-4">{conflicts.length ? conflicts.map(conflict => <div key={conflict.id} className="rounded-2xl border border-sand/20 p-4"><p className="font-bold">{getFullName(conflict.a)} <span className="text-slate-400">/</span> {getFullName(conflict.b)}</p><select value={conflict.resolution} onChange={e => resolve(conflict.id, e.target.value)} className="mt-3 w-full rounded-xl border border-sand/30 bg-background p-3"><option value="keep_both_as_separate">Keep both</option><option value="resolved_keep_a">Keep first</option><option value="resolved_keep_b">Keep second</option></select></div>) : <p className="rounded-2xl bg-sand/10 p-5 text-sm font-bold">No duplicate people were found. The session is ready to complete.</p>}</div><button type="button" onClick={finish} disabled={isPending} className="mt-6 w-full rounded-xl bg-forest py-3 font-black text-cream disabled:opacity-50">{isPending ? 'MERGING...' : 'COMPLETE MERGE'}</button></>}</div></div>
}
