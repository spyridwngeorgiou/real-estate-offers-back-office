import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, FileText, GitCompare } from 'lucide-react'
import { Topbar } from '../components/layout/Topbar'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { OfferForm } from '../components/offers/OfferForm'
import { OfferCompare } from '../components/offers/OfferCompare'
import { useOffers, useCreateOffer } from '../hooks/useOffers'
import { fmtMoney, fmtDate, OFFER_STATUS_LABELS, OFFER_CATEGORY_LABELS } from '../lib/utils'
import { useUIStore } from '../store/uiStore'
import { uploadFile } from '../lib/storage'
import { supabase } from '../lib/supabase'

const STATUS_OPTIONS = [
  { value: '', label: 'Όλες οι καταστάσεις' },
  { value: 'pending', label: 'Εκκρεμείς' },
  { value: 'countered', label: 'Αντιπροσφορά' },
  { value: 'accepted', label: 'Αποδεκτές' },
  { value: 'rejected', label: 'Απορρίφθηκαν' },
  { value: 'withdrawn', label: 'Ανακλήθηκαν' },
  { value: 'signed', label: 'Υπογράφηκαν' },
]

const CATEGORY_OPTIONS = [
  { value: '', label: 'Όλες οι κατηγορίες' },
  ...Object.entries(OFFER_CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l })),
]

export function Offers() {
  const navigate = useNavigate()
  const addToast = useUIStore(s => s.addToast)
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [compareOpen, setCompareOpen] = useState(false)

  const { data: offers = [], isLoading } = useOffers({ status: statusFilter || undefined })
  const createOffer = useCreateOffer()

  const filtered = offers.filter((o: any) => {
    if (categoryFilter && o.category !== categoryFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        o.property?.address?.toLowerCase().includes(q) ||
        o.buyer?.full_name?.toLowerCase().includes(q) ||
        o.contractor?.full_name?.toLowerCase().includes(q)
      )
    }
    return true
  })

  async function handleCreate(values: any) {
    const offer = await createOffer.mutateAsync(values)
    for (const file of pendingPhotos) {
      try {
        const { bucket_path } = await uploadFile('offer', offer.id, file, 'Φωτογραφία')
        await supabase.from('files').insert({ entity_type: 'offer', entity_id: offer.id, bucket_path, file_name: file.name, file_size: file.size, mime_type: file.type, label: 'Φωτογραφία' })
      } catch { /* skip */ }
    }
    setPendingPhotos([])
    addToast('Προσφορά καταχωρήθηκε', 'success')
    setModalOpen(false)
  }

  return (
    <div>
      <Topbar title="Προσφορές" actions={
        <div className="flex gap-2">
          {selectedIds.size >= 2 && (
            <Button variant="secondary" onClick={() => setCompareOpen(true)}>
              <GitCompare size={16} /> Σύγκριση ({selectedIds.size})
            </Button>
          )}
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Νέα Προσφορά
          </Button>
        </div>
      } />

      <div className="p-4 lg:p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Αναζήτηση ακινήτου ή αγοραστή…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {isLoading
          ? <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">Φόρτωση…</div>
          : filtered.length === 0
            ? <EmptyState icon={<FileText size={48} />} title="Δεν βρέθηκαν προσφορές"
                description="Καταχωρήστε την πρώτη σας προσφορά."
                action={<Button variant="primary" onClick={() => setModalOpen(true)}><Plus size={16} /> Νέα Προσφορά</Button>} />
            : <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-3 py-3 w-10">
                          <input type="checkbox" className="rounded border-slate-300"
                            checked={selectedIds.size === filtered.length && filtered.length > 0}
                            onChange={e => setSelectedIds(e.target.checked ? new Set(filtered.map((o: any) => o.id)) : new Set())} />
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ακίνητο</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Κατηγορία</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Αγοραστής / Ανάδοχος</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Τιμή</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">vs Ζητούμενη</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Κατάσταση</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ημερομηνία</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Λήξη</th>
                        <th className="px-5 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((o: any) => {
                        const listPrice = o.property?.list_price
                        const diff = listPrice ? ((o.offer_price - listPrice) / listPrice * 100) : null
                        return (
                          <tr key={o.id}
                            className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${selectedIds.has(o.id) ? 'bg-blue-50' : ''}`}>
                            <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                              <input type="checkbox" className="rounded border-slate-300"
                                checked={selectedIds.has(o.id)}
                                onChange={e => {
                                  const next = new Set(selectedIds)
                                  e.target.checked ? next.add(o.id) : next.delete(o.id)
                                  if (next.size <= 4) setSelectedIds(next)
                                }} />
                            </td>
                            <td className="px-5 py-3" onClick={() => navigate(`/offers/${o.id}`)}>
                              <div className="font-medium text-slate-900">{o.property?.address ?? '—'}</div>
                              <div className="text-xs text-slate-400">{o.property?.city ?? ''}</div>
                            </td>
                            <td className="px-5 py-3" onClick={() => navigate(`/offers/${o.id}`)}>
                              {o.category ? <span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{OFFER_CATEGORY_LABELS[o.category] ?? o.category}</span> : <span className="text-slate-400">—</span>}
                            </td>
                            <td className="px-5 py-3 text-slate-700" onClick={() => navigate(`/offers/${o.id}`)}>
                              {o.buyer?.full_name ?? o.contractor?.full_name ?? '—'}
                            </td>
                            <td className="px-5 py-3 font-bold text-slate-900" onClick={() => navigate(`/offers/${o.id}`)}>{fmtMoney(o.offer_price)}</td>
                            <td className="px-5 py-3" onClick={() => navigate(`/offers/${o.id}`)}>
                              {diff !== null
                                ? <span className={`text-xs font-medium ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {diff >= 0 ? '+' : ''}{diff.toFixed(1)}%
                                  </span>
                                : <span className="text-slate-400">—</span>
                              }
                            </td>
                            <td className="px-5 py-3" onClick={() => navigate(`/offers/${o.id}`)}>
                              <Badge label={OFFER_STATUS_LABELS[o.status] ?? o.status} variant={o.status} />
                            </td>
                            <td className="px-5 py-3 text-slate-400 whitespace-nowrap" onClick={() => navigate(`/offers/${o.id}`)}>{fmtDate(o.offer_date)}</td>
                            <td className="px-5 py-3 text-slate-400 whitespace-nowrap" onClick={() => navigate(`/offers/${o.id}`)}>{fmtDate(o.expires_at)}</td>
                            <td className="px-5 py-3">
                              <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); navigate(`/offers/${o.id}`) }}>
                                Άνοιγμα →
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
        }
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Νέα Προσφορά" size="lg">
        <OfferForm onSubmit={handleCreate} onCancel={() => setModalOpen(false)} loading={createOffer.isPending} onPhotosChange={setPendingPhotos} />
      </Modal>

      {compareOpen && (
        <OfferCompare
          offers={filtered.filter((o: any) => selectedIds.has(o.id))}
          onClose={() => setCompareOpen(false)}
        />
      )}
    </div>
  )
}
