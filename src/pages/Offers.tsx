import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, FileText } from 'lucide-react'
import { Topbar } from '../components/layout/Topbar'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { OfferForm } from '../components/offers/OfferForm'
import { useOffers, useCreateOffer } from '../hooks/useOffers'
import { fmtMoney, fmtDate, OFFER_STATUS_LABELS } from '../lib/utils'
import { useUIStore } from '../store/uiStore'
import { uploadFile } from '../lib/storage'
import { supabase } from '../lib/supabase'

const STATUS_OPTIONS = [
  { value: '', label: 'Όλες' },
  { value: 'pending', label: 'Εκκρεμείς' },
  { value: 'countered', label: 'Αντιπροσφορά' },
  { value: 'accepted', label: 'Αποδεκτές' },
  { value: 'rejected', label: 'Απορρίφθηκαν' },
  { value: 'withdrawn', label: 'Ανακλήθηκαν' },
  { value: 'signed', label: 'Υπογράφηκαν' },
]

export function Offers() {
  const navigate = useNavigate()
  const addToast = useUIStore(s => s.addToast)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([])

  const { data: offers = [], isLoading } = useOffers({ status: statusFilter || undefined })
  const createOffer = useCreateOffer()

  const filtered = search
    ? offers.filter((o: any) =>
        o.property?.address?.toLowerCase().includes(search.toLowerCase()) ||
        o.buyer?.full_name?.toLowerCase().includes(search.toLowerCase())
      )
    : offers

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
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Νέα Προσφορά
        </Button>
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
                        <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ακίνητο</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Αγοραστής</th>
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
                          <tr key={o.id} onClick={() => navigate(`/offers/${o.id}`)}
                            className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                            <td className="px-5 py-3">
                              <div className="font-medium text-slate-900">{o.property?.address ?? '—'}</div>
                              <div className="text-xs text-slate-400">{o.property?.city ?? ''}</div>
                            </td>
                            <td className="px-5 py-3 text-slate-700">{o.buyer?.full_name ?? '—'}</td>
                            <td className="px-5 py-3 font-bold text-slate-900">{fmtMoney(o.offer_price)}</td>
                            <td className="px-5 py-3">
                              {diff !== null
                                ? <span className={`text-xs font-medium ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {diff >= 0 ? '+' : ''}{diff.toFixed(1)}%
                                  </span>
                                : <span className="text-slate-400">—</span>
                              }
                            </td>
                            <td className="px-5 py-3">
                              <Badge label={OFFER_STATUS_LABELS[o.status] ?? o.status} variant={o.status} />
                            </td>
                            <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{fmtDate(o.offer_date)}</td>
                            <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{fmtDate(o.expires_at)}</td>
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
    </div>
  )
}
