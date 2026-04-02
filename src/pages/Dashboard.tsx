import { useNavigate } from 'react-router-dom'
import { Building2, Plus } from 'lucide-react'
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
  const { data: properties = [] } = useProperties()
  const { data: offers = [] } = useOffers()
  const { data: activities = [] } = useActivities(10)

  const pendingOffers = offers.filter(o => o.status === 'pending' || o.status === 'countered')
  const acceptedOffers = offers.filter(o => o.status === 'accepted' || o.status === 'signed')
  const recentOffers = [...offers].slice(0, 8)

  const activityIcon = (type: string) => {
    if (type.includes('offer')) return '📄'
    if (type.includes('property')) return '🏠'
    if (type.includes('contact')) return '👤'
    return '•'
  }

  return (
    <div>
      <Topbar title="Dashboard" actions={
        <Button variant="primary" onClick={() => navigate('/offers')}>
          <Plus size={16} /> Νέα Προσφορά
        </Button>
      } />
      <div className="p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Ακίνητα" value={properties.length} color="blue" />
          <StatCard label="Συνολικές Προσφορές" value={offers.length} color="slate" />
          <StatCard label="Εκκρεμείς" value={pendingOffers.length} color="amber" sub="Pending / Counter" />
          <StatCard label="Αποδεκτές" value={acceptedOffers.length} color="green" sub="Accepted / Signed" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Πρόσφατες Προσφορές</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/offers')}>Όλες →</Button>
            </div>
            {recentOffers.length === 0
              ? <p className="text-slate-400 text-sm p-5">Δεν υπάρχουν προσφορές ακόμα.</p>
              : <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
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
                ? <p className="text-slate-400 text-sm p-5">Καμία δραστηριότητα.</p>
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

        {/* Offer value summary by status */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Αξία Προσφορών ανά Κατάσταση</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {['pending', 'countered', 'accepted', 'rejected', 'withdrawn', 'signed'].map(status => {
              const statusOffers = offers.filter(o => o.status === status)
              const total = statusOffers.reduce((sum: number, o: any) => sum + (o.offer_price || 0), 0)
              return (
                <div key={status} className="text-center p-3 bg-slate-50 rounded-lg">
                  <Badge label={OFFER_STATUS_LABELS[status]} variant={status as any} />
                  <p className="text-lg font-bold text-slate-900 mt-2">{statusOffers.length}</p>
                  <p className="text-xs text-slate-400">{fmtMoney(total || null)}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
