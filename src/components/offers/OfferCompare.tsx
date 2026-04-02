import { X } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { fmtMoney, fmtDate, OFFER_STATUS_LABELS, FINANCING_OPTIONS } from '../../lib/utils'
import type { Property } from '../../types'

interface OfferCompareProps {
  offers: any[]
  property: Property
  onClose: () => void
}

export function OfferCompare({ offers, property, onClose }: OfferCompareProps) {
  const maxPrice = Math.max(...offers.map(o => o.offer_price))

  const rows: { label: string; render: (o: any) => React.ReactNode }[] = [
    { label: 'Τιμή Προσφοράς', render: (o) => (
      <span className={`font-bold text-lg ${o.offer_price === maxPrice ? 'text-green-600' : 'text-slate-900'}`}>
        {fmtMoney(o.offer_price)} {o.offer_price === maxPrice && '⭐'}
      </span>
    )},
    { label: '% vs Ζητούμενη', render: (o) => {
      const list = property.list_price
      if (!list) return <span>—</span>
      const pct = ((o.offer_price - list) / list * 100).toFixed(1)
      return <span className={Number(pct) >= 0 ? 'text-green-600' : 'text-red-600'}>{Number(pct) >= 0 ? '+' : ''}{pct}%</span>
    }},
    { label: 'Κατάσταση', render: (o) => <Badge label={OFFER_STATUS_LABELS[o.status] ?? o.status} variant={o.status} /> },
    { label: 'Αγοραστής', render: (o) => <span>{o.buyer?.full_name ?? '—'}</span> },
    { label: 'Αρραβώνας', render: (o) => <span>{fmtMoney(o.earnest_money)}</span> },
    { label: 'Χρηματοδότηση', render: (o) => <span>{FINANCING_OPTIONS.find(f => f.value === o.financing)?.label ?? o.financing ?? '—'}</span> },
    { label: 'Due Diligence', render: (o) => <span>{o.due_diligence_days ? `${o.due_diligence_days} ημέρες` : '—'}</span> },
    { label: 'Λήξη', render: (o) => <span>{fmtDate(o.expires_at)}</span> },
    { label: 'Ημ. Υπογραφής', render: (o) => <span>{fmtDate(o.signing_date)}</span> },
    { label: 'Ειδικοί Όροι', render: (o) => <span className="text-xs">{o.special_terms ?? '—'}</span> },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold">Σύγκριση Προσφορών</h2>
            <p className="text-sm text-slate-500">{property.address} — Ζητούμενη: {fmtMoney(property.list_price)}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X size={20} /></button>
        </div>
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase w-36">Κριτήριο</th>
                {offers.map(o => (
                  <th key={o.id} className={`px-5 py-3 text-left ${o.offer_price === maxPrice ? 'bg-green-50' : ''}`}>
                    <div className="font-semibold text-slate-900">{fmtMoney(o.offer_price)}</div>
                    <div className="text-xs text-slate-400 font-normal">{fmtDate(o.offer_date)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.label} className="border-b border-slate-100">
                  <td className="px-5 py-3 text-slate-500 font-medium bg-slate-50">{row.label}</td>
                  {offers.map(o => (
                    <td key={o.id} className={`px-5 py-3 ${o.offer_price === maxPrice ? 'bg-green-50/40' : ''}`}>
                      {row.render(o)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
