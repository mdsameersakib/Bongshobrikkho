import { AlertTriangle } from 'lucide-react'

export function QueryError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : 'Unable to load this data.'

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-black">Something went wrong</p>
          <p className="mt-1 text-sm">{message}</p>
        </div>
      </div>
    </div>
  )
}
