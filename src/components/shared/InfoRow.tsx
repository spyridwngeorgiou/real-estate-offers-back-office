import { ReactNode } from 'react'

interface InfoRowProps {
  label: string
  value: ReactNode
}

export function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <span className="text-sm text-slate-500 dark:text-slate-400 shrink-0">{label}</span>
      <span className="text-sm font-medium text-slate-900 dark:text-slate-100 text-right">{value ?? '—'}</span>
    </div>
  )
}
