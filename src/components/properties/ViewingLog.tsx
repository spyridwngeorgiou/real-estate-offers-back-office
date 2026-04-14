import { useState } from 'react'
import { Trash2, Plus } from 'lucide-react'
import { useViewings, useCreateViewing, useDeleteViewing } from '../../hooks/useViewings'
import { useContacts } from '../../hooks/useContacts'
import { Button } from '../ui/Button'
import { selectClass, inputClass } from '../ui/FormField'

export function ViewingLog({ propertyId }: { propertyId: string }) {
  const { data: viewings = [] } = useViewings(propertyId)
  const { data: contacts = [] } = useContacts()
  const createViewing = useCreateViewing(propertyId)
  const deleteViewing = useDeleteViewing(propertyId)

  const now = new Date().toISOString().slice(0, 16)
  const [contactId, setContactId] = useState('')
  const [viewedAt, setViewedAt] = useState(now)
  const [notes, setNotes] = useState('')

  async function handleAdd() {
    if (!contactId || !viewedAt) return
    await createViewing.mutateAsync({
      contact_id: contactId,
      viewed_at: new Date(viewedAt).toISOString(),
      notes: notes || null,
    })
    setContactId('')
    setViewedAt(new Date().toISOString().slice(0, 16))
    setNotes('')
  }

  function fmtDt(iso: string) {
    return new Date(iso).toLocaleString('el-GR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 dark:text-white">Επισκέψεις</h3>
        {viewings.length > 0 && (
          <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
            {viewings.length} επισκέψεις
          </span>
        )}
      </div>

      {/* Add row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        <select value={contactId} onChange={e => setContactId(e.target.value)} className={selectClass}>
          <option value="">— Επαφή —</option>
          {contacts.map(c => (
            <option key={c.id} value={c.id}>{c.full_name}</option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={viewedAt}
          onChange={e => setViewedAt(e.target.value)}
          className={inputClass}
        />
        <div className="flex gap-2">
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Σχόλιο (προαιρετικό)"
            className={inputClass + ' flex-1'}
          />
          <Button variant="primary" size="sm" onClick={handleAdd} disabled={!contactId || !viewedAt || createViewing.isPending}>
            <Plus size={14} />
          </Button>
        </div>
      </div>

      {viewings.length === 0
        ? <p className="text-sm text-slate-400 dark:text-slate-500">Δεν έχουν καταγραφεί επισκέψεις.</p>
        : <div className="space-y-2">
            {viewings.map(v => (
              <div key={v.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {v.contact?.full_name ?? '—'}
                  </p>
                  {v.notes && <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{v.notes}</p>}
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">{fmtDt(v.viewed_at)}</span>
                <button onClick={() => deleteViewing.mutate(v.id)} className="text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
      }
    </div>
  )
}
