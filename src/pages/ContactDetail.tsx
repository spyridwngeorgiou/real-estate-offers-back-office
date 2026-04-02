import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Mail, Phone } from 'lucide-react'
import { Topbar } from '../components/layout/Topbar'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ContactForm } from '../components/contacts/ContactForm'
import { NotesList } from '../components/shared/NotesList'
import { FileUpload } from '../components/ui/FileUpload'
import { useContact, useUpdateContact, useDeleteContact } from '../hooks/useContacts'
import { useOffers } from '../hooks/useOffers'
import { useUIStore } from '../store/uiStore'
import { CONTACT_TYPE_LABELS, OFFER_STATUS_LABELS, fmtMoney, fmtDate } from '../lib/utils'

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900 text-right">{value ?? '—'}</span>
    </div>
  )
}

export function ContactDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addToast = useUIStore(s => s.addToast)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: contact, isLoading } = useContact(id)
  const { data: allOffers = [] } = useOffers()
  const updateContact = useUpdateContact()
  const deleteContact = useDeleteContact()

  if (isLoading) return <div className="p-8 text-slate-400">Φόρτωση…</div>
  if (!contact) return <div className="p-8 text-slate-400">Δεν βρέθηκε η επαφή.</div>

  const relatedOffers = allOffers.filter((o: any) =>
    o.buyer_id === id || o.buyer_agent_id === id || o.seller_agent_id === id || o.notary_id === id || o.contractor_id === id
  )

  async function handleDelete() {
    await deleteContact.mutateAsync(contact!.id)
    addToast('Επαφή διαγράφηκε', 'info')
    navigate('/contacts')
  }

  return (
    <div>
      <Topbar title={contact.full_name} actions={
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate('/contacts')}><ArrowLeft size={15} /></Button>
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}><Edit size={15} /> Επεξεργασία</Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}><Trash2 size={15} /></Button>
        </div>
      } />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold text-slate-900">{contact.full_name}</h2>
                <Badge label={CONTACT_TYPE_LABELS[contact.contact_type] ?? contact.contact_type} variant={contact.contact_type} />
              </div>
              {contact.company && <p className="text-slate-500">{contact.company}</p>}
            </div>
            <div className="flex flex-col gap-2">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <Mail size={15} />{contact.email}
                </a>
              )}
              {contact.mobile && (
                <a href={`tel:${contact.mobile}`} className="flex items-center gap-2 text-sm text-slate-700">
                  <Phone size={15} />{contact.mobile}
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-sm text-slate-700">
                  <Phone size={15} />{contact.phone}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Contact details */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Στοιχεία Επαφής</h3>
            <InfoRow label="Τύπος" value={CONTACT_TYPE_LABELS[contact.contact_type]} />
            <InfoRow label="Εταιρεία" value={contact.company} />
            <InfoRow label="Email" value={contact.email} />
            <InfoRow label="Τηλέφωνο" value={contact.phone} />
            <InfoRow label="Κινητό" value={contact.mobile} />
            <InfoRow label="Αρ. Άδειας" value={contact.license_no} />
            <InfoRow label="ΑΦΜ" value={contact.tax_id} />
            <InfoRow label="Διεύθυνση" value={contact.address} />
            {contact.notes && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Σημειώσεις</p>
                <p className="text-sm text-slate-700">{contact.notes}</p>
              </div>
            )}
          </div>

          {/* Related offers + notes + files */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Σχετικές Προσφορές ({relatedOffers.length})</h3>
              </div>
              {relatedOffers.length === 0
                ? <p className="text-sm text-slate-400 p-5">Δεν υπάρχουν σχετικές προσφορές.</p>
                : <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-slate-100 bg-slate-50">
                        <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ακίνητο</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Τιμή</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Κατάσταση</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ημερομηνία</th>
                      </tr></thead>
                      <tbody>
                        {relatedOffers.map((o: any) => (
                          <tr key={o.id} onClick={() => navigate(`/offers/${o.id}`)}
                            className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer">
                            <td className="px-5 py-3 font-medium">{o.property?.address ?? '—'}</td>
                            <td className="px-5 py-3 font-bold">{fmtMoney(o.offer_price)}</td>
                            <td className="px-5 py-3">
                              <Badge label={OFFER_STATUS_LABELS[o.status] ?? o.status} variant={o.status} />
                            </td>
                            <td className="px-5 py-3 text-slate-400">{fmtDate(o.offer_date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              }
            </div>

            {id && <NotesList entityType="contact" entityId={id} />}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Αρχεία & Έγγραφα</h3>
              {id && <FileUpload entityType="contact" entityId={id} />}
            </div>
          </div>
        </div>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Επεξεργασία Επαφής" size="md">
        <ContactForm initial={contact} onSubmit={async v => {
          try {
            await updateContact.mutateAsync({ id: contact.id, values: v })
            addToast('Αποθηκεύτηκε', 'success')
            setEditOpen(false)
          } catch (err: any) {
            if (err?.code === '23505') {
              const msg = err?.message ?? ''
              if (msg.includes('email')) addToast('Υπάρχει ήδη επαφή με αυτό το email.', 'error')
              else if (msg.includes('mobile')) addToast('Υπάρχει ήδη επαφή με αυτό το κινητό.', 'error')
              else addToast('Υπάρχει ήδη επαφή με τα ίδια στοιχεία.', 'error')
            } else {
              addToast('Σφάλμα αποθήκευσης.', 'error')
            }
          }
        }} onCancel={() => setEditOpen(false)} loading={updateContact.isPending} />
      </Modal>

      <ConfirmDialog open={deleteOpen} title="Διαγραφή Επαφής"
        message={`Διαγραφή "${contact.full_name}"; Η ενέργεια είναι μόνιμη.`}
        onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} />
    </div>
  )
}
