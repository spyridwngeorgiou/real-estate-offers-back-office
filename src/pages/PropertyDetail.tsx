import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Plus, GitCompare } from 'lucide-react'
import { Topbar } from '../components/layout/Topbar'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { PropertyForm } from '../components/properties/PropertyForm'
import { FileUpload } from '../components/ui/FileUpload'
import { OfferForm } from '../components/offers/OfferForm'
import { OfferCompare } from '../components/offers/OfferCompare'
import { NotesList } from '../components/shared/NotesList'
import { useProperty, useUpdateProperty, useDeleteProperty } from '../hooks/useProperties'
import { useOffers, useCreateOffer, useUpdateOffer } from '../hooks/useOffers'
import { useUIStore } from '../store/uiStore'
import { fmtMoney, fmtDate, pricePerSqm, PROPERTY_TYPE_LABELS, PROPERTY_STATUS_LABELS, OFFER_STATUS_LABELS, FLOOR_OPTIONS } from '../lib/utils'

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-slate-900 text-right">{value || '—'}</span>
    </div>
  )
}

export function PropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addToast = useUIStore(s => s.addToast)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [offerFormOpen, setOfferFormOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)

  const { data: property, isLoading } = useProperty(id)
  const { data: offers = [] } = useOffers({ property_id: id })
  const updateProperty = useUpdateProperty()
  const deleteProperty = useDeleteProperty()
  const createOffer = useCreateOffer()
  const updateOffer = useUpdateOffer()

  if (isLoading) return <div className="p-8 text-slate-400">Φόρτωση…</div>
  if (!property) return <div className="p-8 text-slate-400">Δεν βρέθηκε το ακίνητο.</div>

  const floorLabel = FLOOR_OPTIONS.find(f => f.value === property.floor)?.label

  async function handleDelete() {
    await deleteProperty.mutateAsync(property!.id)
    addToast('Ακίνητο διαγράφηκε', 'info')
    navigate('/properties')
  }

  async function handleStatusChange(offerId: string, status: string) {
    await updateOffer.mutateAsync({ id: offerId, values: { status: status as any } })
    addToast('Κατάσταση ενημερώθηκε', 'success')
  }

  return (
    <div>
      <Topbar title={property.address} actions={
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate('/properties')}><ArrowLeft size={15} /></Button>
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}><Edit size={15} /> Επεξεργασία</Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}><Trash2 size={15} /></Button>
        </div>
      } />

      <div className="p-4 lg:p-6 space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold text-slate-900">{property.address}</h2>
                <Badge label={PROPERTY_STATUS_LABELS[property.status]} variant={property.status} />
              </div>
              <p className="text-slate-500">{[property.neighborhood, property.city, property.postal_code].filter(Boolean).join(', ')}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-slate-900">{fmtMoney(property.list_price)}</p>
              {property.list_price && property.sqm && <p className="text-sm text-slate-400">{pricePerSqm(property.list_price, property.sqm)}</p>}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Στοιχεία Ακινήτου</h3>
            <InfoRow label="Τύπος" value={PROPERTY_TYPE_LABELS[property.property_type]} />
            <InfoRow label="Εμβαδόν" value={property.sqm ? `${property.sqm} τ.μ.` : null} />
            <InfoRow label="Εμβαδόν Οικοπέδου" value={property.plot_sqm ? `${property.plot_sqm} τ.μ.` : null} />
            <InfoRow label="Υπνοδωμάτια" value={property.bedrooms} />
            <InfoRow label="Μπάνια" value={property.bathrooms} />
            <InfoRow label="Όροφος" value={floorLabel} />
            <InfoRow label="Έτος Κατασκευής" value={property.year_built} />
            <InfoRow label="Ενεργειακή Κλάση" value={property.energy_rating} />
            <InfoRow label="Κοινόχρηστα" value={property.common_expenses ? `€${property.common_expenses}/μήνα` : null} />
            <InfoRow label="Στάθμευση" value={property.has_parking ? '✓ Ναι' : 'Όχι'} />
            <InfoRow label="Αποθήκη" value={property.has_storage ? '✓ Ναι' : 'Όχι'} />
            <InfoRow label="Κωδικός" value={property.listing_code} />
            <InfoRow label="Ημ. Καταχώρισης" value={fmtDate(property.listing_date)} />
            {property.description && <p className="text-sm text-slate-500 mt-3 pt-3 border-t border-slate-100">{property.description}</p>}
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Προσφορές ({offers.length})</h3>
                <div className="flex gap-2">
                  {offers.length >= 2 && (
                    <Button variant="secondary" size="sm" onClick={() => setCompareOpen(true)}>
                      <GitCompare size={14} /> Σύγκριση
                    </Button>
                  )}
                  <Button variant="primary" size="sm" onClick={() => setOfferFormOpen(true)}>
                    <Plus size={14} /> Νέα Προσφορά
                  </Button>
                </div>
              </div>
              {offers.length === 0
                ? <div className="p-8 text-center text-slate-400 text-sm">Δεν υπάρχουν προσφορές για αυτό το ακίνητο.</div>
                : <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-slate-100 bg-slate-50">
                        <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Αγοραστής</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Τιμή</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Κατάσταση</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ημ/νία</th>
                        <th className="px-5 py-3"></th>
                      </tr></thead>
                      <tbody>
                        {offers.map((o: any) => (
                          <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="px-5 py-3 font-medium">{o.buyer?.full_name ?? '—'}</td>
                            <td className="px-5 py-3 font-bold">{fmtMoney(o.offer_price)}</td>
                            <td className="px-5 py-3"><Badge label={OFFER_STATUS_LABELS[o.status] ?? o.status} variant={o.status} /></td>
                            <td className="px-5 py-3 text-slate-400">{fmtDate(o.offer_date)}</td>
                            <td className="px-5 py-3">
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/offers/${o.id}`)}>Άνοιγμα →</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              }
            </div>

            {id && <NotesList entityType="property" entityId={id} />}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Αρχεία & Έγγραφα</h3>
              {id && <FileUpload entityType="property" entityId={id} />}
            </div>
          </div>
        </div>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Επεξεργασία Ακινήτου" size="lg">
        <PropertyForm initial={property} onSubmit={async v => {
          try {
            await updateProperty.mutateAsync({ id: property.id, values: v })
            addToast('Αποθηκεύτηκε', 'success')
            setEditOpen(false)
          } catch (err: any) {
            if (err?.code === '23505') addToast('Υπάρχει ήδη ακίνητο με την ίδια διεύθυνση, πόλη και γειτονιά.', 'error')
            else addToast('Σφάλμα αποθήκευσης.', 'error')
          }
        }} onCancel={() => setEditOpen(false)} loading={updateProperty.isPending} />
      </Modal>

      <ConfirmDialog open={deleteOpen} title="Διαγραφή Ακινήτου"
        message={`Διαγραφή "${property.address}"; Θα διαγραφούν και όλες οι σχετικές προσφορές.`}
        onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} />

      <Modal open={offerFormOpen} onClose={() => setOfferFormOpen(false)} title="Νέα Προσφορά" size="lg">
        <OfferForm prePropertyId={id} onSubmit={async v => {
          await createOffer.mutateAsync(v)
          addToast('Προσφορά καταχωρήθηκε', 'success')
          setOfferFormOpen(false)
        }} onCancel={() => setOfferFormOpen(false)} loading={createOffer.isPending} />
      </Modal>

      {compareOpen && <OfferCompare offers={offers} property={property} onClose={() => setCompareOpen(false)} />}
    </div>
  )
}
