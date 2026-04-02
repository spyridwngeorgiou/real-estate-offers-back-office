import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, AlertTriangle, Building2, FileText, Users, ArrowRight } from 'lucide-react'
import { Topbar } from '../components/layout/Topbar'
import { StatCard } from '../components/ui/StatCard'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useProperties } from '../hooks/useProperties'
import { useOffers } from '../hooks/useOffers'
import { useActivities } from '../hooks/useActivities'
import { fmtMoney, fmtDate, timeAgo, OFFER_STATUS_LABELS } from '../lib/utils'

export function Dashboard() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!localStorage.getItem('re_onboarded')) {
      navigate('/guide')
    }
  }, [])

  const { data: properties = [] } = useProperties()
  const { data: offers = [] } = useOffers()
  const { data: activities = [] } = useActivities(10)

  const pendingOffers = offers.filter(o => o.status === 'pending' || o.status === 'countered')
  const acceptedOffers = offers.filter(o => o.status === 'accepted' || o.status === 'signed')
  const recentOffers = [...offers].slice(0, 8)

  const today = new Date()
  const expiringSoon = offers.filter(o =>
    (o.status === 'pending' || o.status === 'countered') &&
    o.expires_at &&
    new Date(o.expires_at) >= today &&
    (new Date(o.expires_at).getTime() - today.getTime()) / 86400000 <= 3
  )
  const expired = offers.filter(o =>
    (o.status === 'pending' || o.status === 'countered') &&
    o.expires_at &&
    new Date(o.expires_at) < today
  )

  const isEmpty = properties.length === 0 && offers.length === 0

  const activityIcon = (type: string) => {
    if (type.includes('offer')) return '📄'
    if (type.includes('property')) return '🏠'
    if (type.includes('contact')) return '👤'
    return '•'
  }

  return (
    <div>
      <Topbar title="Αρχική" actions={
        <Button variant="primary" onClick={() => navigate('/offers')}>
          <Plus size={16} /> Νέα Προσφορά
        </Button>
      } />

      <div className="p-4 lg:p-6 space-y-6">

        {/* First-time empty state: guide the user */}
        {isEmpty && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-1">Καλώς ήρθατε!</h2>
            <p className="text-sm text-blue-700 mb-5">Ξεκινήστε προσθέτοντας το πρώτο σας ακίνητο και μετά καταχωρήστε τις προσφορές που λαμβάνετε.</p>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { icon: Building2, label: 'Προσθέστε ακίνητο', sub: 'Καταχωρήστε διεύθυνση, τιμή και τύπο', to: '/properties', color: 'bg-blue-600' },
                { icon: Users, label: 'Προσθέστε επαφές', sub: 'Αγοραστές, μεσίτες, τεχνίτες', to: '/contacts', color: 'bg-violet-600' },
                { icon: FileText, label: 'Καταχωρήστε προσφορά', sub: 'Συνδέστε ακίνητο με τιμή προσφοράς', to: '/offers', color: 'bg-emerald-600' },
              ].map(({ icon: Icon, label, sub, to, color }) => (
                <button key={to} onClick={() => navigate(to)}
                  className="flex items-center gap-3 bg-white rounded-lg p-4 border border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all text-left group">
                  <div className={`${color} w-10 h-10 rounded-lg flex items-center justify-center shrink-0`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm group-hover:text-blue-700">{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Alerts */}
        {(expiringSoon.length > 0 || expired.length > 0) && (
          <div className="space-y-2">
            {expired.length > 0 && (
              <button onClick={() => navigate('/offers')}
                className="w-full flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 hover:bg-red-100 transition-colors text-left">
                <AlertTriangle size={16} className="shrink-0" />
                <span className="flex-1">
                  <strong>{expired.length}</strong> προσφορ{expired.length === 1 ? 'ά' : 'ές'} {expired.length === 1 ? 'έχει λήξει' : 'έχουν λήξει'} χωρίς απόφαση
                </span>
                <ArrowRight size={14} className="shrink-0" />
              </button>
            )}
            {expiringSoon.length > 0 && (
              <button onClick={() => navigate('/offers')}
                className="w-full flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 hover:bg-amber-100 transition-colors text-left">
                <AlertTriangle size={16} className="shrink-0" />
                <span className="flex-1">
                  <strong>{expiringSoon.length}</strong> προσφορ{expiringSoon.length === 1 ? 'ά λήγει' : 'ές λήγουν'} εντός 3 ημερών
                </span>
                <ArrowRight size={14} className="shrink-0" />
              </button>
            )}
          </div>
        )}

        {/* KPI cards — clickable */}
        {!isEmpty && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button onClick={() => navigate('/properties')} className="text-left hover:scale-[1.02] transition-transform">
              <StatCard label="Ακίνητα" value={properties.length} color="blue" />
            </button>
            <button onClick={() => navigate('/offers')} className="text-left hover:scale-[1.02] transition-transform">
              <StatCard label="Συνολικές Προσφορές" value={offers.length} color="slate" />
            </button>
            <button onClick={() => navigate('/offers')} className="text-left hover:scale-[1.02] transition-transform">
              <StatCard label="Εκκρεμείς" value={pendingOffers.length} color="amber" sub="Αναμένουν απόφαση" />
            </button>
            <button onClick={() => navigate('/offers')} className="text-left hover:scale-[1.02] transition-transform">
              <StatCard label="Αποδεκτές / Υπογεγραμμένες" value={acceptedOffers.length} color="green" />
            </button>
          </div>
        )}

        {/* Recent offers + Activity */}
        {!isEmpty && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900">Πρόσφατες Προσφορές</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate('/offers')}>Όλες →</Button>
              </div>
              {recentOffers.length === 0
                ? <div className="p-8 text-center text-slate-400 text-sm">
                    <FileText size={32} className="mx-auto mb-2 opacity-30" />
                    <p>Δεν υπάρχουν προσφορές ακόμα.</p>
                    <Button variant="primary" size="sm" className="mt-3" onClick={() => navigate('/offers')}>
                      <Plus size={14} /> Νέα Προσφορά
                    </Button>
                  </div>
                : <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ακίνητο</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Τιμή</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Κατάσταση</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ημερομηνία</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOffers.map(o => (
                          <tr key={o.id} onClick={() => navigate(`/offers/${o.id}`)}
                            className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors">
                            <td className="px-5 py-3 font-medium text-slate-700">{o.property?.address ?? '—'}</td>
                            <td className="px-5 py-3 font-bold text-slate-900">{fmtMoney(o.offer_price)}</td>
                            <td className="px-5 py-3">
                              <Badge label={OFFER_STATUS_LABELS[o.status] ?? o.status} variant={o.status} />
                            </td>
                            <td className="px-5 py-3 text-slate-400">{fmtDate(o.offer_date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              }
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900">Πρόσφατη Δραστηριότητα</h2>
              </div>
              <div className="divide-y divide-slate-50">
                {activities.length === 0
                  ? <p className="text-slate-400 text-sm p-5">Καμία δραστηριότητα ακόμα.</p>
                  : activities.map(a => (
                      <div key={a.id} className="flex gap-3 px-5 py-3">
                        <span className="text-base shrink-0 mt-0.5">{activityIcon(a.event_type)}</span>
                        <div>
                          <p className="text-sm text-slate-700">{a.description}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{timeAgo(a.created_at)}</p>
                        </div>
                      </div>
                    ))
                }
              </div>
            </div>
          </div>
        )}

        {/* Status summary */}
        {offers.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Σύνοψη Προσφορών</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {['pending', 'countered', 'accepted', 'rejected', 'withdrawn', 'signed'].map(status => {
                const statusOffers = offers.filter(o => o.status === status)
                const total = statusOffers.reduce((sum: number, o: any) => sum + (o.offer_price || 0), 0)
                return (
                  <button key={status} onClick={() => navigate('/offers')}
                    className="text-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <Badge label={OFFER_STATUS_LABELS[status]} variant={status as any} />
                    <p className="text-xl font-bold text-slate-900 mt-2">{statusOffers.length}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{fmtMoney(total || null)}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
