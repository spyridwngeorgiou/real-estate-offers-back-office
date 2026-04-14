interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  color?: 'blue' | 'green' | 'amber' | 'red' | 'slate'
}

const COLORS = {
  blue:  'border-l-blue-500',
  green: 'border-l-green-500',
  amber: 'border-l-amber-500',
  red:   'border-l-red-500',
  slate: 'border-l-slate-400',
}

export function StatCard({ label, value, sub, color = 'blue' }: StatCardProps) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 border-l-4 ${COLORS[color]} shadow-sm`}>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}
