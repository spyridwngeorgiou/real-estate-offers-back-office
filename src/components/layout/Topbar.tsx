import { ReactNode, useState, useRef, useEffect } from 'react'
import { Menu, Search, Building2, FileText, Users, Sun, Moon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../../store/uiStore'
import { useProperties } from '../../hooks/useProperties'
import { useOffers } from '../../hooks/useOffers'
import { useContacts } from '../../hooks/useContacts'
import { fmtMoney } from '../../lib/utils'

interface TopbarProps { title: string; actions?: ReactNode }

function GlobalSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const q = query.trim().toLowerCase()

  const { data: properties = [] } = useProperties()
  const { data: offers = [] } = useOffers()
  const { data: contacts = [] } = useContacts()

  const results = q.length < 2 ? [] : [
    ...properties
      .filter(p => p.address.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q))
      .slice(0, 3)
      .map(p => ({ type: 'property' as const, id: p.id, label: p.address, sub: [p.city, fmtMoney(p.list_price)].filter(Boolean).join(' · ') })),
    ...contacts
      .filter(c => c.full_name.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q))
      .slice(0, 3)
      .map(c => ({ type: 'contact' as const, id: c.id, label: c.full_name, sub: c.company ?? c.contact_type })),
    ...(offers as any[])
      .filter((o: any) => o.property?.address?.toLowerCase().includes(q) || o.buyer?.full_name?.toLowerCase().includes(q))
      .slice(0, 3)
      .map((o: any) => ({ type: 'offer' as const, id: o.id, label: o.property?.address ?? '—', sub: fmtMoney(o.offer_price) })),
  ]

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function go(r: typeof results[0]) {
    setQuery('')
    setOpen(false)
    if (r.type === 'property') navigate(`/properties/${r.id}`)
    else if (r.type === 'contact') navigate(`/contacts/${r.id}`)
    else navigate(`/offers/${r.id}`)
  }

  const Icon = { property: Building2, contact: Users, offer: FileText }

  return (
    <div ref={ref} className="relative hidden sm:block">
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-1.5 w-56 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white dark:focus-within:bg-slate-600 transition-all">
        <Search size={14} className="text-slate-400 shrink-0" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Αναζήτηση…"
          className="bg-transparent text-sm outline-none w-full text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
          {results.map((r, i) => {
            const Ic = Icon[r.type]
            return (
              <button key={i} onClick={() => go(r)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-left border-b border-slate-50 dark:border-slate-700/50 last:border-0 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <Ic size={13} className="text-slate-500 dark:text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{r.label}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{r.sub}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}
      {open && q.length >= 2 && results.length === 0 && (
        <div className="absolute top-full mt-1 left-0 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-50 px-4 py-3 text-sm text-slate-400 dark:text-slate-500">
          Δεν βρέθηκαν αποτελέσματα
        </div>
      )}
    </div>
  )
}

export function Topbar({ title, actions }: TopbarProps) {
  const toggleSidebar = useUIStore(s => s.toggleSidebar)
  const darkMode = useUIStore(s => s.darkMode)
  const toggleDarkMode = useUIStore(s => s.toggleDarkMode)
  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 lg:px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-20">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={toggleSidebar} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 shrink-0">
          <Menu size={20} className="text-slate-600 dark:text-slate-300" />
        </button>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <GlobalSearch />
        {actions && <div className="flex items-center gap-2">{actions}</div>}
        <button
          onClick={toggleDarkMode}
          aria-label={darkMode ? 'Φωτεινή λειτουργία' : 'Σκοτεινή λειτουργία'}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  )
}
