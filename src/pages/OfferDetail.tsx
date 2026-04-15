import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Plus, Check, X as XIcon, Mail, Printer } from 'lucide-react'
import { Topbar } from '../components/layout/Topbar'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { OfferForm } from '../components/offers/OfferForm'
import { FileUpload } from '../components/ui/FileUpload'
import { DetailPageSkeleton } from '../components/ui/Skeleton'
import { NotesList } from '../components/shared/NotesList'
import { TaskList } from '../components/shared/TaskList'
import { InfoRow } from '../components/shared/InfoRow'
import { useOffer, useUpdateOffer, useDeleteOffer, useCreateCounterOffer } from '../hooks/useOffers'
import { CounterOfferForm } from '../components/offers/CounterOfferForm'
import { CommissionList } from '../components/offers/CommissionList'
import { OfferPrintView } from '../components/offers/OfferPrintView'
import { EmailSendModal } from '../components/shared/EmailSendModal'
import { offerVars } from '../lib/templateUtils'
import { useUIStore } from '../store/uiStore'
import { fmtMoney, fmtDate, OFFER_STATUS_LABELS, OFFER_CATEGORY_LABELS, FINANCING_OPTIONS } from '../lib/utils'


const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending:   ['accepted', 'rejected', 'withdrawn', 'countered'],
  countered: ['accepted', 'rejected', 'withdrawn'],
  accepted:  ['signed', 'withdrawn'],
  signed:    [],
  rejected:  ['pending'],
  withdrawn: ['pending'],
}

const STATUS_LABELS_BTN: Record<string, string> = {
  accepted:  'Αποδοχή',
  rejected:  'Απόρριψη',
  withdrawn: 'Ανάκληση',
  countered: 'Αντιπροσφορά',
  signed:    'Υπογραφή',
  pending:   'Επαναφορά σε Εκκρεμές',
}

export function OfferDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addToast = useUIStore(s => s.addToast)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [counterOpen, setCounterOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)

  const { data: offer, isLoading } = useOffer(id)
  const updateOffer = useUpdateOffer()
  const deleteOffer = useDeleteOffer()
  const createCounter = useCreateCounterOffer()

  if (isLoading) return <><Topbar title="Προσφορά" /><DetailPageSkeleton /></>
  if (!offer) return <div className="p-8 text-slate-400 dark:text-slate-500">Δεν βρέθηκε η προσφορά.</div>

  const financing = FINANCING_OPTIONS.find(f => f.value === offer.financing)?.label ?? offer.financing
  const counterOffers = [...(offer.counter_offers ?? [])].sort((a: any, b: any) => a.round - b.round)
  const nextRound = counterOffers.length + 1
  const availableTransitions = STATUS_TRANSITIONS[offer.status] ?? []

  async function handleStatusChange(status: string) {
    await updateOffer.mutateAsync({ id: offer.id, values: { status: status as any } })
    addToast(`Κατάσταση: ${OFFER_STATUS_LABELS[status]}`, 'success')
  }

  async function handleDelete() {
    await deleteOffer.mutateAsync(offer.id)
    addToast('Προσφορά διαγράφηκε', 'info')
    navigate('/offers')
  }

  async function handleCounterSubmit(values: { counter_price: number; from_party: 'seller' | 'buyer'; notes?: string }) {
    await createCounter.mutateAsync({
      offer_id: offer.id,
      round: nextRound,
      counter_price: values.counter_price,
      counter_date: new Date().toISOString().slice(0, 10),
      expires_at: null,
      notes: values.notes || null,
      from_party: values.from_party,
    })
    addToast('Αντιπροσφορά καταχωρήθηκε', 'success')
    setCounterOpen(false)
  }

  return (
    <div>
      <Topbar title={`Προσφορά ${fmtMoney(offer.offer_price)}`} actions={
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={() => navigate('/offers')}><ArrowLeft size={15} /></Button>
          <Button variant="secondary" size="sm" onClick={() => setEmailOpen(true)}><Mail size={15} /> Email</Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}><Printer size={15} /> PDF</Button>
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}><Edit size={15} /> Επεξεργασία</Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}><Trash2 size={15} /></Button>
        </div>
      } />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Header card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{fmtMoney(offer.offer_price)}</h2>
                <Badge label={OFFER_STATUS_LABELS[offer.status] ?? offer.status} variant={offer.status} />
              </div>
              <p className="text-slate-500 dark:text-slate-400">{offer.property?.address}{offer.property?.city ? `, ${offer.property.city}` : ''}</p>
              {offer.property?.list_price && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Ζητούμενη: {fmtMoney(offer.property.list_price)} —
                  Διαφορά: {((offer.offer_price - offer.property.list_price) / offer.property.list_price * 100).toFixed(1)}%
                </p>
              )}
            </div>
          </div>

          {/* Visual status stepper */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700">
            {/* Main flow */}
            <div className="flex items-center gap-1 flex-wrap">
              {(['pending', 'countered', 'accepted', 'signed'] as const).map((s, i, arr) => {
                const flow = ['pending', 'countered', 'accepted', 'signed']
                const currentIdx = flow.indexOf(offer.status)
                const stepIdx = flow.indexOf(s)
                const isDone = currentIdx > stepIdx
                const isCurrent = offer.status === s
                const isReachable = STATUS_TRANSITIONS[offer.status]?.includes(s)
                const labels: Record<string, string> = { pending: 'Εκκρεμής', countered: 'Αντιπροσφορά', accepted: 'Αποδεκτή', signed: 'Υπογράφηκε' }
                return (
                  <div key={s} className="flex items-center gap-1">
                    <button
                      disabled={!isReachable && !isCurrent}
                      onClick={() => isReachable ? (s === 'countered' ? setCounterOpen(true) : handleStatusChange(s)) : undefined}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                        ${isCurrent ? 'bg-blue-600 text-white shadow-sm' : isDone ? 'bg-green-100 text-green-700' : isReachable ? 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 cursor-pointer' : 'bg-slate-50 text-slate-300 cursor-default'}`}
                    >
                      {isDone && <Check size={11} />}
                      {labels[s]}
                    </button>
                    {i < arr.length - 1 && <span className="text-slate-200 text-xs">→</span>}
                  </div>
                )
              })}
            </div>
            {/* Exit actions */}
            {(offer.status === 'pending' || offer.status === 'countered' || offer.status === 'accepted') && (
              <div className="flex gap-2 mt-3">
                {STATUS_TRANSITIONS[offer.status]?.filter(s => s === 'rejected' || s === 'withdrawn').map(s => (
                  <button key={s}
                    onClick={() => handleStatusChange(s)}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors">
                    <XIcon size={11} />
                    {STATUS_LABELS_BTN[s]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Details */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Οικονομικά Στοιχεία</h3>
              <InfoRow label="Τιμή Προσφοράς" value={fmtMoney(offer.offer_price)} />
              {offer.vat_rate != null && offer.vat_rate > 0 && (
                <>
                  <InfoRow label="ΦΠΑ" value={`${offer.vat_rate}% ${offer.vat_included ? '(περιλαμβάνεται)' : ''}`} />
                  {offer.vat_included
                    ? <InfoRow label="Καθαρή Αξία" value={fmtMoney(Math.round(offer.offer_price / (1 + offer.vat_rate / 100)))} />
                    : <InfoRow label="Τελική Τιμή με ΦΠΑ" value={
                        <span className="text-amber-700 font-bold">{fmtMoney(Math.round(offer.offer_price * (1 + offer.vat_rate / 100)))}</span>
                      } />
                  }
                </>
              )}
              <InfoRow label="Αρραβώνας" value={fmtMoney(offer.earnest_money)} />
              <InfoRow label="Ίδια Κεφάλαια" value={fmtMoney(offer.down_payment)} />
              <InfoRow label="Χρηματοδότηση" value={financing} />
              <InfoRow label="Due Diligence" value={offer.due_diligence_days ? `${offer.due_diligence_days} ημέρες` : null} />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Ημερομηνίες</h3>
              <InfoRow label="Ημ. Προσφοράς" value={fmtDate(offer.offer_date)} />
              <InfoRow label="Λήξη" value={fmtDate(offer.expires_at)} />
              <InfoRow label="Ημ. Υπογραφής" value={fmtDate(offer.signing_date)} />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Εμπλεκόμενα Μέρη</h3>
              {(offer as any).category && <InfoRow label="Κατηγορία" value={OFFER_CATEGORY_LABELS[(offer as any).category] ?? (offer as any).category} />}
              {(offer as any).scope && <InfoRow label="Εύρος Εργασιών" value={(offer as any).scope} />}
              <InfoRow label="Αγοραστής" value={offer.buyer?.full_name} />
              {offer.buyer?.phone && <InfoRow label="Τηλ. Αγοραστή" value={offer.buyer.phone} />}
              {offer.buyer?.email && <InfoRow label="Email Αγοραστή" value={offer.buyer.email} />}
              {(offer as any).contractor?.full_name && (
                <>
                  <InfoRow label="Ανάδοχος / Τεχνίτης" value={(offer as any).contractor.full_name} />
                  {(offer as any).contractor.phone && <InfoRow label="Τηλ. Αναδόχου" value={(offer as any).contractor.phone} />}
                  {(offer as any).contractor.email && <InfoRow label="Email Αναδόχου" value={(offer as any).contractor.email} />}
                </>
              )}
              <InfoRow label="Μεσίτης Αγοραστή" value={offer.buyer_agent?.full_name} />
              <InfoRow label="Μεσίτης Πωλητή" value={offer.seller_agent?.full_name} />
              <InfoRow label="Συμβολαιογράφος" value={offer.notary?.full_name} />
            </div>

            {(offer.special_terms || offer.internal_notes) && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
                {offer.special_terms && (
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Ειδικοί Όροι</h4>
                    <p className="text-sm text-slate-700">{offer.special_terms}</p>
                  </div>
                )}
                {offer.internal_notes && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Εσωτερικές Σημειώσεις</h4>
                    <p className="text-sm text-slate-700">{offer.internal_notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Counter offers */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white">Ιστορικό Αντιπροσφορών ({counterOffers.length})</h3>
                <Button variant="secondary" size="sm" onClick={() => setCounterOpen(true)}>
                  <Plus size={14} /> Νέα Αντιπροσφορά
                </Button>
              </div>
              {counterOffers.length === 0
                ? <p className="text-sm text-slate-400 dark:text-slate-500 p-5">Δεν υπάρχουν αντιπροσφορές.</p>
                : <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                        <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Γύρος</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Τιμή</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Από</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Ημερομηνία</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Σημειώσεις</th>
                      </tr></thead>
                      <tbody>
                        {counterOffers.map((c: any) => (
                          <tr key={c.id} className="border-b border-slate-50 dark:border-slate-700/50">
                            <td className="px-5 py-3 font-medium text-slate-500 dark:text-slate-400">#{c.round}</td>
                            <td className="px-5 py-3 font-bold text-slate-900 dark:text-white">{fmtMoney(c.counter_price)}</td>
                            <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{c.from_party === 'seller' ? 'Πωλητής' : c.from_party === 'buyer' ? 'Αγοραστής' : c.from_party ?? '—'}</td>
                            <td className="px-5 py-3 text-slate-400 dark:text-slate-500">{fmtDate(c.counter_date)}</td>
                            <td className="px-5 py-3 text-slate-500 dark:text-slate-400 text-xs">{c.notes ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              }
            </div>

            {id && <CommissionList offerId={id} offerPrice={offer.offer_price} />}
            {id && <NotesList entityType="offer" entityId={id} />}
            {id && <TaskList entityType="offer" entityId={id} />}

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Αρχεία & Έγγραφα</h3>
              {id && <FileUpload entityType="offer" entityId={id} />}
            </div>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Επεξεργασία Προσφοράς" size="lg">
        <OfferForm initial={offer} onSubmit={async v => {
          await updateOffer.mutateAsync({ id: offer.id, values: v })
          addToast('Αποθηκεύτηκε', 'success')
          setEditOpen(false)
        }} onCancel={() => setEditOpen(false)} loading={updateOffer.isPending} />
      </Modal>

      <ConfirmDialog open={deleteOpen} title="Διαγραφή Προσφοράς"
        message="Η διαγραφή είναι μόνιμη. Συνέχεια;"
        onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} />

      <EmailSendModal
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        recipientEmail={(offer as any).buyer?.email ?? (offer as any).contractor?.email ?? ''}
        recipientName={(offer as any).buyer?.full_name ?? (offer as any).contractor?.full_name ?? ''}
        vars={offerVars(offer)}
        suggestedCategory={offer.status === 'accepted' ? 'acceptance' : offer.status === 'rejected' ? 'rejection' : offer.status === 'countered' ? 'counter_offer' : 'offer'}
      />

      {/* Counter offer modal */}
      <Modal open={counterOpen} onClose={() => setCounterOpen(false)} title={`Αντιπροσφορά — Γύρος ${nextRound}`} size="sm">
        <CounterOfferForm
          round={nextRound}
          originalPrice={offer.offer_price}
          onSubmit={handleCounterSubmit}
          onCancel={() => setCounterOpen(false)}
          loading={createCounter.isPending}
        />
      </Modal>

      {/* Print-only view — hidden on screen, shown by @media print */}
      <OfferPrintView offer={offer} />
    </div>
  )
}
