import { useState, useMemo } from 'react'
import { Topbar } from '../components/layout/Topbar'
import { StatCard } from '../components/ui/StatCard'
import { Badge } from '../components/ui/Badge'
import { useProperties } from '../hooks/useProperties'
import { useOffers } from '../hooks/useOffers'
import { fmtMoney, OFFER_STATUS_LABELS, OFFER_CATEGORY_LABELS, PROPERTY_STATUS_LABELS, PROPERTY_TYPE_LABELS } from '../lib/utils'

type DateRange = '30d' | '3m' | '12m' | 'all'

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: '30d', label: '30 Ημέρες' },
  { value: '3m',  label: '3 Μήνες' },
  { value: '12m', label: '12 Μήνες' },
  { value: 'all', label: 'Όλα' },
]

function getRangeCutoff(range: DateRange): Date | null {
  const now = new Date()
  if (range === '30d') return new Date(now.setDate(now.getDate() - 30))
  if (range === '3m')  return new Date(now.setMonth(now.getMonth() - 3))
  if (range === '12m') return new Date(now.setFullYear(now.getFullYear() - 1))
  return null
}

export function Analytics() {
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const { data: properties = [] } = useProperties()
  const { data: allOffers = [] } = useOffers()

  const offers = useMemo(() => {
    const cutoff = getRangeCutoff(dateRange)
    if (!cutoff) return allOffers
    return allOffers.filter((o: any) => new Date(o.offer_date) >= cutoff)
  }, [allOffers, dateRange])

  const PURCHASE_CATS = ['purchase']
  const RENTAL_CATS = ['rental']
  const RENOVATION_CATS = ['renovation_full', 'renovation_partial', 'electrical', 'plumbing',
    'hvac', 'structural', 'insulation', 'flooring', 'painting', 'windows', 'roofing', 'finishing', 'equipment']

  const purchaseOffers = offers.filter((o: any) => PURCHASE_CATS.includes(o.category))
  const rentalOffers = offers.filter((o: any) => RENTAL_CATS.includes(o.category))
  const renovationOffers = offers.filter((o: any) => RENOVATION_CATS.includes(o.category))

  const totalListValue = properties.reduce((s, p) => s + (p.list_price ?? 0), 0)
  const avgPurchasePrice = purchaseOffers.length
    ? Math.round(purchaseOffers.reduce((s: number, o: any) => s + o.offer_price, 0) / purchaseOffers.length)
    : null
  const avgRentalPrice = rentalOffers.length
    ? Math.round(rentalOffers.reduce((s: number, o: any) => s + o.offer_price, 0) / rentalOffers.length)
    : null
  const totalRenovationValue = renovationOffers.reduce((s: number, o: any) => s + o.offer_price, 0)

  const acceptedSigned = offers.filter((o: any) => o.status === 'accepted' || o.status === 'signed').length
  const closedNegatively = offers.filter((o: any) => o.status === 'rejected' || o.status === 'withdrawn').length
  const total = acceptedSigned + closedNegatively
  const successRate = total > 0 ? Math.round(acceptedSigned / total * 100) : 0

  // By status
  const statusBreakdown = ['pending', 'countered', 'accepted', 'rejected', 'withdrawn', 'signed'].map(s => ({
    status: s,
    count: offers.filter((o: any) => o.status === s).length,
    value: offers.filter((o: any) => o.status === s).reduce((sum: number, o: any) => sum + o.offer_price, 0),
  }))

  const maxCount = Math.max(...statusBreakdown.map(s => s.count), 1)

  // Property status breakdown
  const propStatusBreakdown = ['listed', 'under_offer', 'sold', 'for_rent', 'rented', 'for_renovation', 'under_renovation', 'expired', 'off_market'].map(s => ({
    status: s,
    count: properties.filter(p => p.status === s).length,
    value: properties.filter(p => p.status === s).reduce((sum, p) => sum + (p.list_price ?? 0), 0),
  }))

  const maxPropCount = Math.max(...propStatusBreakdown.map(s => s.count), 1)

  // By category
  const categoryBreakdown = Object.keys(OFFER_CATEGORY_LABELS).map(cat => ({
    category: cat,
    label: OFFER_CATEGORY_LABELS[cat],
    count: offers.filter((o: any) => o.category === cat).length,
    value: offers.filter((o: any) => o.category === cat).reduce((s: number, o: any) => s + o.offer_price, 0),
  })).filter(c => c.count > 0)
  const maxCatCount = Math.max(...categoryBreakdown.map(c => c.count), 1)

  // By property type
  const propTypeBreakdown = Object.keys(PROPERTY_TYPE_LABELS).map(t => ({
    type: t,
    label: PROPERTY_TYPE_LABELS[t],
    count: properties.filter(p => p.property_type === t).length,
    value: properties.filter(p => p.property_type === t).reduce((s, p) => s + (p.list_price ?? 0), 0),
  })).filter(t => t.count > 0)
  const maxTypeCount = Math.max(...propTypeBreakdown.map(t => t.count), 1)

  // Top properties by offer count
  const propOfferCounts = properties
    .map(p => ({
      property: p,
      count: offers.filter((o: any) => o.property_id === p.id).length,
    }))
    .filter(x => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return (
    <div>
      <Topbar title="Αναλυτικά" actions={
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
          {DATE_RANGE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setDateRange(opt.value)}
              className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                dateRange === opt.value
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      } />
      <div className="p-4 lg:p-6 space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Συνολική Αξία Αγγελιών" value={fmtMoney(totalListValue)} color="blue" />
          <StatCard label="Μ.Ο. Τιμής Αγοράς" value={avgPurchasePrice ? fmtMoney(avgPurchasePrice) : '—'} color="slate"
            sub={purchaseOffers.length ? `${purchaseOffers.length} προσφορές αγοράς` : 'Χωρίς δεδομένα'} />
          <StatCard label="Μ.Ο. Ενοικίου" value={avgRentalPrice ? fmtMoney(avgRentalPrice) : '—'} color="green"
            sub={rentalOffers.length ? `${rentalOffers.length} προσφορές ενοικίασης` : 'Χωρίς δεδομένα'} />
          <StatCard label="Αξία Ανακαινίσεων" value={renovationOffers.length ? fmtMoney(totalRenovationValue) : '—'} color="amber"
            sub={renovationOffers.length ? `${renovationOffers.length} εργασίες` : 'Χωρίς δεδομένα'} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
          <StatCard label="Ποσοστό Επιτυχίας" value={`${successRate}%`} color="green"
            sub={`${acceptedSigned} από ${total} κλειστές`} />
          <StatCard label="Σύνολο Προσφορών" value={offers.length} color="slate"
            sub={`${purchaseOffers.length} αγορά · ${rentalOffers.length} ενοικίαση · ${renovationOffers.length} εργασίες`} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Offers by status bar chart */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Προσφορές ανά Κατάσταση</h2>
            <div className="space-y-3">
              {statusBreakdown.map(({ status, count, value }) => (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge label={OFFER_STATUS_LABELS[status]} variant={status as any} />
                      <span className="text-sm font-semibold text-slate-900">{count}</span>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{fmtMoney(value || null)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Properties by status */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Ακίνητα ανά Κατάσταση</h2>
            <div className="space-y-3">
              {propStatusBreakdown.map(({ status, count, value }) => (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge label={PROPERTY_STATUS_LABELS[status]} variant={status as any} />
                      <span className="text-sm font-semibold text-slate-900">{count}</span>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{fmtMoney(value || null)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${(count / maxPropCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category breakdown */}
        {categoryBreakdown.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Προσφορές ανά Κατηγορία</h2>
              <div className="space-y-3">
                {categoryBreakdown.map(({ category, label, count, value }) => (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{count}</span>
                      </div>
                      <span className="text-xs text-slate-400 dark:text-slate-500">{fmtMoney(value || null)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${(count / maxCatCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Ακίνητα ανά Τύπο</h2>
              <div className="space-y-3">
                {propTypeBreakdown.map(({ type, label, count, value }) => (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{count}</span>
                      </div>
                      <span className="text-xs text-slate-400 dark:text-slate-500">{fmtMoney(value || null)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full transition-all duration-500"
                        style={{ width: `${(count / maxTypeCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top properties */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Top Ακίνητα με Περισσότερες Προσφορές</h2>
          {propOfferCounts.length === 0
            ? <p className="text-slate-400 dark:text-slate-500 text-sm">Δεν υπάρχουν δεδομένα ακόμα.</p>
            : <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100 dark:border-slate-700">
                    <th className="pb-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Ακίνητο</th>
                    <th className="pb-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Τιμή Αγοράς</th>
                    <th className="pb-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Κατάσταση</th>
                    <th className="pb-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase"># Προσφορές</th>
                  </tr></thead>
                  <tbody>
                    {propOfferCounts.map(({ property, count }) => (
                      <tr key={property.id} className="border-b border-slate-50 dark:border-slate-700/50">
                        <td className="py-3 font-medium text-slate-900 dark:text-slate-100">{property.address}</td>
                        <td className="py-3 text-slate-700 dark:text-slate-300">{fmtMoney(property.list_price)}</td>
                        <td className="py-3">
                          <Badge label={PROPERTY_STATUS_LABELS[property.status]} variant={property.status} />
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 bg-blue-200 dark:bg-blue-900/50 rounded-full w-20 overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${(count / (propOfferCounts[0]?.count || 1)) * 100}%` }} />
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">{count}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </div>

        {/* Offer value by status summary */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Συνολική Αξία Προσφορών</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {statusBreakdown.filter(s => s.value > 0).map(({ status, count, value }) => (
              <div key={status} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                <Badge label={OFFER_STATUS_LABELS[status]} variant={status as any} />
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-2">{fmtMoney(value)}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{count} προσφορ{count === 1 ? 'ά' : 'ές'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion funnel */}
        {offers.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-1">Χοάνη Μετατροπής</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">Πόσες προσφορές προχώρησαν σε κάθε στάδιο</p>
            <div className="space-y-2">
              {[
                { key: 'all',       label: 'Σύνολο Προσφορών',       color: 'bg-slate-400 dark:bg-slate-500' },
                { key: 'countered', label: 'Έφτασαν σε Αντιπροσφορά', color: 'bg-blue-400' },
                { key: 'accepted',  label: 'Αποδεκτές',               color: 'bg-green-400' },
                { key: 'signed',    label: 'Υπογράφηκαν',             color: 'bg-emerald-500' },
              ].map(({ key, label, color }) => {
                const count = key === 'all'
                  ? offers.length
                  : offers.filter((o: any) => o.status === key || (key === 'accepted' && (o.status === 'accepted' || o.status === 'signed'))).length
                const pct = offers.length > 0 ? Math.round((count / offers.length) * 100) : 0
                return (
                  <div key={key} className="flex items-center gap-4">
                    <div className="w-40 shrink-0 text-sm text-slate-600 dark:text-slate-300 truncate">{label}</div>
                    <div className="flex-1 h-7 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-lg transition-all duration-700 flex items-center justify-end pr-3`}
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      >
                        <span className="text-xs font-semibold text-white">{count}</span>
                      </div>
                    </div>
                    <div className="w-12 text-right text-sm font-medium text-slate-500 dark:text-slate-400">{pct}%</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
