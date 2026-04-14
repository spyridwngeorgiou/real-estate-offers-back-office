import { useState } from 'react'
import { Trash2, Plus } from 'lucide-react'
import { useCommissions, useCreateCommission, useUpdateCommission, useDeleteCommission } from '../../hooks/useCommissions'
import { useContacts } from '../../hooks/useContacts'
import { Button } from '../ui/Button'
import { fmtMoney } from '../../lib/utils'
import { selectClass, inputClass } from '../ui/FormField'

interface CommissionListProps {
  offerId: string
  offerPrice: number
}

export function CommissionList({ offerId, offerPrice }: CommissionListProps) {
  const { data: commissions = [] } = useCommissions(offerId)
  const { data: contacts = [] } = useContacts()
  const createCommission = useCreateCommission(offerId)
  const updateCommission = useUpdateCommission(offerId)
  const deleteCommission = useDeleteCommission(offerId)

  const [agentId, setAgentId] = useState('')
  const [rate, setRate] = useState('')
  const [manualAmount, setManualAmount] = useState('')
  const [notes, setNotes] = useState('')

  function computedAmount(): number | null {
    if (manualAmount) return parseFloat(manualAmount) || null
    if (rate && offerPrice) return Math.round(offerPrice * parseFloat(rate) / 100)
    return null
  }

  async function handleAdd() {
    const amount = computedAmount()
    await createCommission.mutateAsync({
      offer_id: offerId,
      agent_contact_id: agentId || null,
      rate: rate ? parseFloat(rate) : null,
      amount,
      invoiced: false,
      received: false,
      notes: notes || null,
    })
    setAgentId('')
    setRate('')
    setManualAmount('')
    setNotes('')
  }

  const total = commissions.reduce((sum, c) => sum + (c.amount ?? 0), 0)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
      <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Προμήθειες</h3>

      {/* Add row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
        <select value={agentId} onChange={e => setAgentId(e.target.value)} className={selectClass}>
          <option value="">— Μεσίτης / Επαφή —</option>
          {contacts.map(c => (
            <option key={c.id} value={c.id}>{c.full_name}</option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <input
            type="number" min="0" max="100" step="0.01"
            value={rate} onChange={e => setRate(e.target.value)}
            placeholder="% ποσοστό"
            className={inputClass}
          />
        </div>
        <input
          type="number" min="0"
          value={manualAmount} onChange={e => setManualAmount(e.target.value)}
          placeholder="ή χειρ. ποσό €"
          className={inputClass}
        />
        <Button variant="primary" size="sm" onClick={handleAdd} disabled={createCommission.isPending || (!rate && !manualAmount)}>
          <Plus size={14} /> Προσθήκη
        </Button>
      </div>

      {commissions.length === 0
        ? <p className="text-sm text-slate-400 dark:text-slate-500">Δεν υπάρχουν καταχωρημένες προμήθειες.</p>
        : <>
            <div className="space-y-2">
              {commissions.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      {c.agent?.full_name ?? '—'}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {c.rate != null ? `${c.rate}%` : ''}{c.rate != null && c.amount != null ? ' · ' : ''}{c.amount != null ? fmtMoney(c.amount) : ''}
                      {c.notes ? ` · ${c.notes}` : ''}
                    </p>
                  </div>
                  <label className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={c.invoiced}
                      onChange={() => updateCommission.mutate({ id: c.id, values: { invoiced: !c.invoiced } })}
                      className="rounded border-slate-300 accent-blue-600 w-3.5 h-3.5"
                    />
                    Τιμολόγιο
                  </label>
                  <label className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={c.received}
                      onChange={() => updateCommission.mutate({ id: c.id, values: { received: !c.received } })}
                      className="rounded border-slate-300 accent-green-600 w-3.5 h-3.5"
                    />
                    Εισπράχθηκε
                  </label>
                  <button onClick={() => deleteCommission.mutate(c.id)} className="text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors shrink-0">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            {total > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Σύνολο Προμηθειών</span>
                <span className="font-semibold text-slate-900 dark:text-white">{fmtMoney(total)}</span>
              </div>
            )}
          </>
      }
    </div>
  )
}
