import { Topbar } from '../components/layout/Topbar'
import { StatCard } from '../components/ui/StatCard'
import { Badge } from '../components/ui/Badge'
import { useProperties } from '../hooks/useProperties'
import { useOffers } from '../hooks/useOffers'
import { fmtMoney, OFFER_STATUS_LABELS, PROPERTY_STATUS_LABELS } from '../lib/utils'

export function Analytics() {
  const { data: properties = [] } = useProperties()
  const { data: offers = [] } = useOffers()

  const totalListValue = properties.reduce((s, p) => s + (p.list_price ?? 0), 0)
  const avgOfferPrice = offers.length
    ? Math.round(offers.reduce((s: number, o: any) => s + o.offer_price, 0) / offers.length)
    : 0

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
  const propStatusBreakdown = ['listed', 'under_offer', 'sold', 'expired', 'off_market'].map(s => ({
    status: s,
    count: properties.filter(p => p.status === s).length,
    value: properties.filter(p => p.status === s).reduce((sum, p) => sum + (p.list_price ?? 0), 0),
  }))

  const maxPropCount = Math.max(...propStatusBreakdown.map(s => s.count), 1)

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
      <Topbar title="Αναλυτικά" />
      <div className="p-4 lg:p-6 space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Συνολική Αξία Αγοράς" value={fmtMoney(totalListValue)} color="blue" />
          <StatCard label="Μ.Ο. Τιμής Προσφοράς" value={fmtMoney(avgOfferPrice)} color="slate" />
          <StatCard label="Ποσοστό Επιτυχίας" value={`${successRate}%`} color="green"
            sub={`${acceptedSigned} από ${total} κλειστές`} />
          <StatCard label="Σύνολο Προσφορών" value={offers.length} color="amber" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Offers by status bar chart */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Προσφορές ανά Κατάσταση</h2>
            <div className="space-y-3">
              {statusBreakdown.map(({ status, count, value }) => (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge label={OFFER_STATUS_LABELS[status]} variant={status as any} />
                      <span className="text-sm font-semibold text-slate-900">{count}</span>
                    </div>
                    <span className="text-xs text-slate-400">{fmtMoney(value || null)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
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
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Ακίνητα ανά Κατάσταση</h2>
            <div className="space-y-3">
              {propStatusBreakdown.map(({ status, count, value }) => (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge label={PROPERTY_STATUS_LABELS[status]} variant={status as any} />
                      <span className="text-sm font-semibold text-slate-900">{count}</span>
                    </div>
                    <span className="text-xs text-slate-400">{fmtMoney(value || null)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
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

        {/* Top properties */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Top Ακίνητα με Περισσότερες Προσφορές</h2>
          {propOfferCounts.length === 0
            ? <p className="text-slate-400 text-sm">Δεν υπάρχουν δεδομένα ακόμα.</p>
            : <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100">
                    <th className="pb-3 text-left text-xs font-medium text-slate-500 uppercase">Ακίνητο</th>
                    <th className="pb-3 text-left text-xs font-medium text-slate-500 uppercase">Τιμή Αγοράς</th>
                    <th className="pb-3 text-left text-xs font-medium text-slate-500 uppercase">Κατάσταση</th>
                    <th className="pb-3 text-left text-xs font-medium text-slate-500 uppercase"># Προσφορές</th>
                  </tr></thead>
                  <tbody>
                    {propOfferCounts.map(({ property, count }) => (
                      <tr key={property.id} className="border-b border-slate-50">
                        <td className="py-3 font-medium text-slate-900">{property.address}</td>
                        <td className="py-3 text-slate-700">{fmtMoney(property.list_price)}</td>
                        <td className="py-3">
                          <Badge label={PROPERTY_STATUS_LABELS[property.status]} variant={property.status} />
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 bg-blue-200 rounded-full w-20 overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${(count / (propOfferCounts[0]?.count || 1)) * 100}%` }} />
                            </div>
                            <span className="font-bold text-slate-900">{count}</span>
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
              <div key={status} className="bg-slate-50 rounded-lg p-4">
                <Badge label={OFFER_STATUS_LABELS[status]} variant={status as any} />
                <p className="text-xl font-bold text-slate-900 mt-2">{fmtMoney(value)}</p>
                <p className="text-xs text-slate-400 mt-0.5">{count} προσφορ{count === 1 ? 'ά' : 'ές'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
