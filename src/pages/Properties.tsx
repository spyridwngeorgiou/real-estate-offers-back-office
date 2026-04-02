import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Building2 } from 'lucide-react'
import { Topbar } from '../components/layout/Topbar'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { PropertyForm } from '../components/properties/PropertyForm'
import { useProperties, useCreateProperty, useUpdateProperty } from '../hooks/useProperties'
import { useOffers } from '../hooks/useOffers'
import { fmtMoney, pricePerSqm, PROPERTY_TYPE_LABELS, PROPERTY_STATUS_LABELS } from '../lib/utils'
import { useUIStore } from '../store/uiStore'
import type { Property } from '../types'

const TYPE_EMOJI: Record<string, string> = {
  apartment: '🏢', maisonette: '🏘️', villa: '🏡', single_family: '🏠',
  plot: '🌿', commercial: '🏬', office: '🏢', other: '🏠',
}

const STATUS_OPTIONS = [
  { value: '', label: 'Όλες οι καταστάσεις' },
  { value: 'listed', label: 'Προς Πώληση' },
  { value: 'under_offer', label: 'Υπό Διαπραγμάτευση' },
  { value: 'sold', label: 'Πουλήθηκε' },
  { value: 'expired', label: 'Έληξε' },
  { value: 'off_market', label: 'Εκτός Αγοράς' },
]

export function Properties() {
  const navigate = useNavigate()
  const addToast = useUIStore(s => s.addToast)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Property | null>(null)

  const { data: properties = [], isLoading } = useProperties({ search, status: statusFilter || undefined })
  const { data: allOffers = [] } = useOffers()
  const createProperty = useCreateProperty()
  const updateProperty = useUpdateProperty()

  async function handleSubmit(values: any) {
    if (editTarget) {
      await updateProperty.mutateAsync({ id: editTarget.id, values })
      addToast('Ακίνητο ενημερώθηκε', 'success')
    } else {
      await createProperty.mutateAsync(values)
      addToast('Ακίνητο προστέθηκε', 'success')
    }
    setModalOpen(false)
    setEditTarget(null)
  }

  return (
    <div>
      <Topbar title="Ακίνητα" actions={
        <Button variant="primary" onClick={() => { setEditTarget(null); setModalOpen(true) }}>
          <Plus size={16} /> Νέο Ακίνητο
        </Button>
      } />

      <div className="p-4 lg:p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Αναζήτηση ακινήτων…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {isLoading
          ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse h-48" />
              ))}
            </div>
          : properties.length === 0
            ? <EmptyState icon={<Building2 size={48} />} title="Δεν βρέθηκαν ακίνητα"
                description="Προσθέστε το πρώτο σας ακίνητο για να ξεκινήσετε."
                action={<Button variant="primary" onClick={() => setModalOpen(true)}><Plus size={16} /> Νέο Ακίνητο</Button>} />
            : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map(p => {
                  const offerCount = allOffers.filter((o: any) => o.property_id === p.id).length
                  return (
                    <div key={p.id} onClick={() => navigate(`/properties/${p.id}`)}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group">
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-3xl">{TYPE_EMOJI[p.property_type] ?? '🏠'}</span>
                          <Badge label={PROPERTY_STATUS_LABELS[p.status] ?? p.status} variant={p.status} />
                        </div>
                        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{p.address}</h3>
                        <p className="text-sm text-slate-500 mt-0.5">{[p.neighborhood, p.city].filter(Boolean).join(', ')}</p>
                        <p className="text-xl font-bold text-slate-900 mt-3">{fmtMoney(p.list_price)}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          {p.sqm && <span>{p.sqm} τ.μ.</span>}
                          {p.list_price && p.sqm && <span>{pricePerSqm(p.list_price, p.sqm)}</span>}
                          {p.bedrooms && <span>{p.bedrooms} υπν.</span>}
                        </div>
                      </div>
                      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span>{PROPERTY_TYPE_LABELS[p.property_type]}</span>
                        <span>{offerCount} {offerCount === 1 ? 'προσφορά' : 'προσφορές'}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
        }
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditTarget(null) }}
        title={editTarget ? 'Επεξεργασία Ακινήτου' : 'Νέο Ακίνητο'} size="lg">
        <PropertyForm
          initial={editTarget ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => { setModalOpen(false); setEditTarget(null) }}
          loading={createProperty.isPending || updateProperty.isPending}
        />
      </Modal>
    </div>
  )
}
