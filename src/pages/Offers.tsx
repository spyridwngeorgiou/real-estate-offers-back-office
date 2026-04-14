import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, FileText, GitCompare, ArrowUp, ArrowDown, Download } from 'lucide-react'
import { Topbar } from '../components/layout/Topbar'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { OfferForm } from '../components/offers/OfferForm'
import { OfferCompare } from '../components/offers/OfferCompare'
import { useOffers, useCreateOffer } from '../hooks/useOffers'
import { fmtMoney, fmtDate, OFFER_STATUS_LABELS, OFFER_CATEGORY_LABELS, exportCSV } from '../lib/utils'
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
  const [formDirty, setFormDirty] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [compareOpen, setCompareOpen] = useState(false)
  const [sortCol, setSortCol] = useState<string>('offer_date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  function toggleSort(col: string) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const { data: offers = [], isLoading } = useOffers({ status: statusFilter || undefined })
  const createOffer = useCreateOffer()

  const filtered = [...offers].filter((o: any) => {
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
  }).sort((a: any, b: any) => {
    let av: any, bv: any
    if (sortCol === 'offer_price') { av = a.offer_price; bv = b.offer_price }
    else if (sortCol === 'offer_date') { av = a.offer_date; bv = b.offer_date }
    else if (sortCol === 'expires_at') { av = a.expires_at ?? ''; bv = b.expires_at ?? '' }
    else if (sortCol === 'property') { av = a.property?.address ?? ''; bv = b.property?.address ?? '' }
    else if (sortCol === 'person') { av = (a.buyer?.full_name ?? a.contractor?.full_name ?? ''); bv = (b.buyer?.full_name ?? b.contractor?.full_name ?? '') }
    else { av = a[sortCol] ?? ''; bv = b[sortCol] ?? '' }
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
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
          {filtered.length > 0 && (
            <Button variant="secondary" onClick={() => exportCSV(filtered.map((o: any) => ({
              'Ακίνητο': o.property?.address ?? '', 'Πόλη': o.property?.city ?? '',
              'Κατηγορία': OFFER_CATEGORY_LABELS[o.category] ?? o.category ?? '',
              'Επαφή': o.buyer?.full_name ?? o.contractor?.full_name ?? '',
              'Τιμή (€)': o.offer_price, 'Κατάσταση': OFFER_STATUS_LABELS[o.status] ?? o.status,
              'Ημερομηνία': fmtDate(o.offer_date), 'Λήξη': fmtDate(o.expires_at),
            })), `προσφορες-${new Date().toISOString().slice(0,10)}.csv`)}>
              <Download size={15} /> CSV
            </Button>
          )}
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
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {isLoading
          ? <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-400 dark:text-slate-500">Φόρτωση…</div>
          : filtered.length === 0
            ? <EmptyState icon={<FileText size={48} />} title="Δεν βρέθηκαν προσφορές"
                description="Καταχωρήστε την πρώτη σας προσφορά."
                action={<Button variant="primary" onClick={() => setModalOpen(true)}><Plus size={16} /> Νέα Προσφορά</Button>} />
            : <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                        <th className="px-3 py-3 w-10">
                          <input type="checkbox" className="rounded border-slate-300"
                            checked={selectedIds.size === filtered.length && filtered.length > 0}
                            onChange={e => setSelectedIds(e.target.checked ? new Set(filtered.map((o: any) => o.id)) : new Set())} />
                        </th>
                        {[
                          { col: 'property', label: 'Ακίνητο' },
                          { col: null, label: 'Κατηγορία' },
                          { col: 'person', label: 'Επαφή' },
                          { col: 'offer_price', label: 'Τιμή' },
                          { col: null, label: 'vs Ζητούμενη' },
                          { col: 'status', label: 'Κατάσταση' },
                          { col: 'offer_date', label: 'Ημερομηνία' },
                          { col: 'expires_at', label: 'Λήξη' },
                        ].map(({ col, label }) => (
                          <th key={label}
                            className={`px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap ${col ? 'cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 select-none' : ''}`}
                            onClick={() => col && toggleSort(col)}>
                            <span className="inline-flex items-center gap-1">
                              {label}
                              {col && sortCol === col && (sortDir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                            </span>
                          </th>
                        ))}
                        <th className="px-5 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((o: any) => {
                        const listPrice = o.property?.list_price
                        const diff = listPrice ? ((o.offer_price - listPrice) / listPrice * 100) : null
                        const isActive = o.status === 'pending' || o.status === 'countered'
                        const expDate = o.expires_at ? new Date(o.expires_at) : null
                        const now = new Date()
                        const isExpired = isActive && expDate && expDate < now
                        const isExpiringSoon = isActive && expDate && !isExpired && (expDate.getTime() - now.getTime()) / 86400000 <= 3
                        const expiryClass = isExpired
                          ? 'text-red-600 dark:text-red-400 font-medium'
                          : isExpiringSoon
                            ? 'text-amber-600 dark:text-amber-400 font-medium'
                            : 'text-slate-400 dark:text-slate-500'
                        return (
                          <tr key={o.id}
                            className={`border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${selectedIds.has(o.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
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
                              <div className="font-medium text-slate-900 dark:text-slate-100">{o.property?.address ?? '—'}</div>
                              <div className="text-xs text-slate-400 dark:text-slate-500">{o.property?.city ?? ''}</div>
                            </td>
                            <td className="px-5 py-3" onClick={() => navigate(`/offers/${o.id}`)}>
                              {o.category ? <Badge label={OFFER_CATEGORY_LABELS[o.category] ?? o.category} variant="default" /> : <span className="text-slate-400 dark:text-slate-500">—</span>}
                            </td>
                            <td className="px-5 py-3 text-slate-700 dark:text-slate-300" onClick={() => navigate(`/offers/${o.id}`)}>
                              {o.buyer?.full_name ?? o.contractor?.full_name ?? '—'}
                            </td>
                            <td className="px-5 py-3 font-bold text-slate-900 dark:text-white" onClick={() => navigate(`/offers/${o.id}`)}>{fmtMoney(o.offer_price)}</td>
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
                            <td className="px-5 py-3 text-slate-400 dark:text-slate-500 whitespace-nowrap" onClick={() => navigate(`/offers/${o.id}`)}>{fmtDate(o.offer_date)}</td>
                            <td className={`px-5 py-3 whitespace-nowrap ${expiryClass}`} onClick={() => navigate(`/offers/${o.id}`)}>
                              {fmtDate(o.expires_at)}
                              {isExpired && <span className="ml-1 text-xs">(Έληξε)</span>}
                              {isExpiringSoon && <span className="ml-1 text-xs">(Σύντομα)</span>}
                            </td>
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

      <Modal open={modalOpen} dirty={formDirty} onClose={() => { setModalOpen(false); setFormDirty(false) }} title="Νέα Προσφορά" size="lg">
        <OfferForm onSubmit={handleCreate} onCancel={() => { setModalOpen(false); setFormDirty(false) }} loading={createOffer.isPending} onPhotosChange={setPendingPhotos} onDirtyChange={setFormDirty} />
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
