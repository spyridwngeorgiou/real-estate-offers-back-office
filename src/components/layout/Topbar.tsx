import { ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { useUIStore } from '../../store/uiStore'

interface TopbarProps { title: string; actions?: ReactNode }

export function Topbar({ title, actions }: TopbarProps) {
  const toggleSidebar = useUIStore(s => s.toggleSidebar)
  return (
    <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-4 flex items-center justify-between gap-4 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100">
          <Menu size={20} />
        </button>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
