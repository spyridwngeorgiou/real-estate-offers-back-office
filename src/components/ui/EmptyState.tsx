import { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-slate-300 dark:text-slate-600 mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">{title}</h3>
      {description && <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}
