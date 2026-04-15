import { useNavigate } from 'react-router-dom'
import { Wrench, CheckCircle2, Clock } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { OFFER_CATEGORY_LABELS, OFFER_STATUS_LABELS, fmtMoney } from '../../lib/utils'

const WORK_CATEGORIES = new Set([
  // Construction
  'new_construction', 'construction_full', 'demolition', 'masonry', 'concrete',
  // Renovation
  'renovation_full', 'renovation_partial',
  // Trades
  'electrical', 'plumbing', 'hvac', 'structural', 'insulation',
  'flooring', 'painting', 'windows', 'roofing', 'finishing',
  'landscaping', 'elevator', 'equipment',
])

interface RenovationBoardProps {
  offers: any[]
}

export function RenovationBoard({ offers }: RenovationBoardProps) {
  const navigate = useNavigate()

  const workOffers = offers.filter(o => WORK_CATEGORIES.has(o.category))
  if (workOffers.length === 0) return null

  // Group by category (trade)
  const groups: Record<string, any[]> = {}
  for (const o of workOffers) {
    if (!groups[o.category]) groups[o.category] = []
    groups[o.category].push(o)
  }

  // Sort groups: categories with accepted offer first, then by number of offers desc
  const sortedTrades = Object.keys(groups).sort((a, b) => {
    const aAccepted = groups[a].some(o => o.status === 'accepted' || o.status === 'signed')
    const bAccepted = groups[b].some(o => o.status === 'accepted' || o.status === 'signed')
    if (aAccepted !== bAccepted) return aAccepted ? -1 : 1
    return groups[b].length - groups[a].length
  })

  const totalBudget = workOffers
    .filter(o => o.status === 'accepted' || o.status === 'signed')
    .reduce((sum, o) => sum + (o.offer_price ?? 0), 0)

  const pendingTrades = sortedTrades.filter(t => !groups[t].some(o => o.status === 'accepted' || o.status === 'signed'))

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Wrench size={16} className="text-amber-500" />
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Προσφορές Εργασιών & Κατασκευής
          </h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {sortedTrades.length} ειδικότητες · {workOffers.length} προσφορές
          </span>
        </div>
        {totalBudget > 0 && (
          <div className="text-right">
            <p className="text-xs text-slate-400 dark:text-slate-500">Αποδεκτές εργασίες</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{fmtMoney(totalBudget)}</p>
          </div>
        )}
      </div>

      {/* Progress bar: trades covered */}
      {sortedTrades.length > 0 && (
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${((sortedTrades.length - pendingTrades.length) / sortedTrades.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {sortedTrades.length - pendingTrades.length}/{sortedTrades.length} ειδικότητες ανατέθηκαν
            </span>
          </div>
        </div>
      )}

      {/* Trade groups */}
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {sortedTrades.map(trade => {
          const tradeOffers = [...groups[trade]].sort((a, b) => a.offer_price - b.offer_price)
          const accepted = tradeOffers.find(o => o.status === 'accepted' || o.status === 'signed')
          const lowestPrice = tradeOffers[0]?.offer_price ?? 0

          return (
            <div key={trade} className="p-4">
              {/* Trade header */}
              <div className="flex items-center gap-2 mb-3">
                {accepted
                  ? <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  : <Clock size={15} className="text-amber-400 shrink-0" />
                }
                <span className="font-semibold text-sm text-slate-900 dark:text-white">
                  {OFFER_CATEGORY_LABELS[trade] ?? trade}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {tradeOffers.length} {tradeOffers.length === 1 ? 'προσφορά' : 'προσφορές'}
                </span>
                {!accepted && tradeOffers.length > 1 && (
                  <span className="text-xs text-blue-500 dark:text-blue-400">
                    Διαφορά: {fmtMoney(tradeOffers[tradeOffers.length - 1].offer_price - lowestPrice)}
                  </span>
                )}
              </div>

              {/* Contractor cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {tradeOffers.map(o => {
                  const isAccepted = o.status === 'accepted' || o.status === 'signed'
                  const isLowest = o.offer_price === lowestPrice && tradeOffers.length > 1
                  return (
                    <button
                      key={o.id}
                      onClick={() => navigate(`/offers/${o.id}`)}
                      className={`text-left p-3 rounded-lg border transition-all hover:shadow-md
                        ${isAccepted
                          ? 'border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/30 hover:border-blue-200 dark:hover:border-blue-600'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {o.contractor?.full_name ?? o.buyer?.full_name ?? '—'}
                        </p>
                        {isAccepted && <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />}
                      </div>
                      <p className={`text-base font-bold mt-1 ${isAccepted ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                        {fmtMoney(o.offer_price)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <Badge label={OFFER_STATUS_LABELS[o.status] ?? o.status} variant={o.status} />
                        {isLowest && !isAccepted && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                            χαμηλότερη
                          </span>
                        )}
                      </div>
                      {o.scope && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">{o.scope}</p>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
