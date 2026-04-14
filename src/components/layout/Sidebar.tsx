import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Building2, FileText, Users, BarChart3, X, HelpCircle, LogOut, Mail, ClipboardList } from 'lucide-react'
import { useUIStore } from '../../store/uiStore'
import { supabase } from '../../lib/supabase'

const NAV = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/properties', icon: Building2,       label: 'Ακίνητα' },
  { to: '/offers',     icon: FileText,        label: 'Προσφορές' },
  { to: '/contacts',   icon: Users,           label: 'Επαφές' },
  { to: '/analytics',  icon: BarChart3,       label: 'Αναλυτικά' },
  { to: '/guide',      icon: HelpCircle,      label: 'Οδηγός' },
]

const NAV_SETTINGS = [
  { to: '/email-templates',  icon: Mail,          label: 'Πρότυπα Email' },
  // { to: '/offer-templates',  icon: ClipboardList, label: 'Πρότυπα Προσφοράς' }, // Hidden for now
]

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? ''))
  }, [])

  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={toggleSidebar} />}

      <aside className={`fixed top-0 left-0 h-full w-60 bg-slate-900 text-white z-40 flex flex-col transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>

        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 size={18} />
            </div>
            <span className="font-semibold text-base">RE Greece</span>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden p-1 hover:bg-slate-700 rounded">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to} end={to === '/'}
              onClick={() => { if (sidebarOpen) toggleSidebar() }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          <div className="pt-3 mt-2 border-t border-slate-700">
            <p className="px-3 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Πρότυπα</p>
            {NAV_SETTINGS.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to} to={to}
                onClick={() => { if (sidebarOpen) toggleSidebar() }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="px-4 py-4 border-t border-slate-700 space-y-3">
          {userEmail && (
            <p className="text-xs text-slate-500 truncate" title={userEmail}>{userEmail}</p>
          )}
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors w-full"
          >
            <LogOut size={14} />
            Αποσύνδεση
          </button>
          <p className="text-xs text-slate-600">RE Offers Greece © 2026</p>
        </div>
      </aside>
    </>
  )
}
