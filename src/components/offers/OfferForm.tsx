import { useState, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { ChevronDown, ChevronUp, MapPin, Euro, Maximize2 } from 'lucide-react'
import { FormField, inputClass, selectClass } from '../ui/FormField'
import { Button } from '../ui/Button'
import { InlinePhotoPicker } from '../ui/InlinePhotoPicker'
import { useProperties } from '../../hooks/useProperties'
import { useContacts } from '../../hooks/useContacts'
import { FINANCING_OPTIONS, OFFER_CATEGORY_LABELS, fmtMoney, pricePerSqm, PROPERTY_TYPE_LABELS } from '../../lib/utils'
import type { Offer } from '../../types'

interface OfferFormProps {
  initial?: Partial<Offer>
  prePropertyId?: string
  onSubmit: (values: any) => Promise<void>
  onCancel: () => void
  loading?: boolean
  onPhotosChange?: (files: File[]) => void
  onDirtyChange?: (dirty: boolean) => void
}

const WORK_CATEGORIES = ['electrical', 'plumbing', 'hvac', 'structural', 'finishing', 'equipment']

function contactFieldLabel(category: string) {
  if (category === 'purchase') return 'Αγοραστής'
  if (WORK_CATEGORIES.includes(category)) return 'Ανάδοχος / Τεχνίτης'
  return 'Επαφή (αγοραστής, ανάδοχος ή άλλος)'
}

function contactIdField(category: string) {
  return WORK_CATEGORIES.includes(category) ? 'contractor_id' : 'buyer_id'
}

export function OfferForm({ initial, prePropertyId, onSubmit, onCancel, loading, onPhotosChange, onDirtyChange }: OfferFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const { register, handleSubmit, control, formState: { errors, isDirty, dirtyFields } } = useForm({
    defaultValues: {
      ...initial,
      property_id: initial?.property_id ?? prePropertyId ?? '',
      offer_date: initial?.offer_date ?? new Date().toISOString().slice(0, 10),
      status: initial?.status ?? 'pending',
      category: (initial as any)?.category ?? '',
      contact_person_id: (initial as any)?.buyer_id ?? (initial as any)?.contractor_id ?? '',
    }
  })

  useEffect(() => { onDirtyChange?.(isDirty) }, [isDirty])

  const category = useWatch({ control, name: 'category' })
  const selectedPropertyId = useWatch({ control, name: 'property_id' })
  const isPurchase = !category || category === 'purchase'

  const { data: properties = [] } = useProperties()
  const { data: allContacts = [] } = useContacts()
  const { data: agents = [] } = useContacts({ type: 'agent' })
  const { data: notaries = [] } = useContacts({ type: 'notary' })

  const selectedProperty = properties.find(p => p.id === selectedPropertyId)

  // Build form values: map contact_person_id to the right column
  async function handleSubmitWrapped(raw: any) {
    const { contact_person_id, ...rest } = raw
    const field = contactIdField(raw.category)
    const isEditing = !!initial?.id
    const nullIfEmpty = (v: any) => (v === '' || v === undefined || (typeof v === 'number' && isNaN(v)) ? null : v)

    const values: any = { ...rest }

    // Always resolve the contact person fields
    values.buyer_id = field === 'buyer_id' ? contact_person_id || null : null
    values.contractor_id = field === 'contractor_id' ? contact_person_id || null : null

    // For optional fields: when editing, only include if the user actually changed them
    // so we don't overwrite existing data with null
    const optionalFields = ['buyer_agent_id', 'seller_agent_id', 'notary_id', 'financing', 'special_terms', 'internal_notes', 'category', 'expires_at', 'signing_date', 'earnest_money', 'down_payment', 'due_diligence_days']
    for (const f of optionalFields) {
      if (isEditing && !dirtyFields[f as keyof typeof dirtyFields]) {
        delete values[f]
      } else {
        values[f] = nullIfEmpty(values[f])
      }
    }

    await onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit(handleSubmitWrapped)} className="space-y-5">

      {/* Category + Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Κατηγορία" hint="Τι αφορά αυτή η προσφορά;">
          <select {...register('category')} className={selectClass}>
            <option value="">— Επιλέξτε —</option>
            {Object.entries(OFFER_CATEGORY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Κατάσταση">
          <select {...register('status')} className={selectClass}>
            <option value="pending">Εκκρεμής</option>
            <option value="countered">Αντιπροσφορά</option>
            <option value="accepted">Αποδεκτή</option>
            <option value="rejected">Απορρίφθηκε</option>
            <option value="withdrawn">Ανακλήθηκε</option>
            <option value="signed">Υπογράφηκε</option>
          </select>
        </FormField>
      </div>

      {/* Property picker + preview */}
      <div>
        <FormField label="Ακίνητο" required error={errors.property_id?.message as string}>
          <select {...register('property_id', { required: 'Παρακαλώ επιλέξτε ακίνητο' })} className={selectClass}>
            <option value="">— Επιλέξτε Ακίνητο —</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.address}{p.city ? `, ${p.city}` : ''}</option>
            ))}
          </select>
        </FormField>
        {selectedProperty && (
          <div className="mt-2 flex flex-wrap gap-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-xs text-blue-800">
            <span className="flex items-center gap-1"><MapPin size={12} />{selectedProperty.address}{selectedProperty.city ? `, ${selectedProperty.city}` : ''}</span>
            {selectedProperty.list_price && <span className="flex items-center gap-1 font-semibold"><Euro size={12} />{fmtMoney(selectedProperty.list_price)}</span>}
            {selectedProperty.sqm && <span className="flex items-center gap-1"><Maximize2 size={12} />{selectedProperty.sqm} τ.μ.</span>}
            {selectedProperty.sqm && selectedProperty.list_price && <span className="text-blue-600">{pricePerSqm(selectedProperty.list_price, selectedProperty.sqm)}</span>}
            <span className="text-blue-500">{PROPERTY_TYPE_LABELS[selectedProperty.property_type]}</span>
          </div>
        )}
      </div>

      {/* Price + Date + Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Τιμή Προσφοράς (€)" required error={errors.offer_price?.message as string}
          hint={selectedProperty?.list_price ? `Ζητούμενη: ${fmtMoney(selectedProperty.list_price)}` : undefined}>
          <input
            {...register('offer_price', { required: 'Απαιτείται τιμή', valueAsNumber: true, min: { value: 1, message: 'Η τιμή πρέπει να είναι μεγαλύτερη από 0' } })}
            type="number" className={inputClass} placeholder="305000"
          />
        </FormField>
        <FormField label="Ημερομηνία Προσφοράς" required>
          <input {...register('offer_date', { required: true })} type="date" className={inputClass} />
        </FormField>

        <div className="sm:col-span-2">
          <FormField label={contactFieldLabel(category)}>
            <select {...register('contact_person_id')} className={selectClass}>
              <option value="">— Επιλέξτε —</option>
              {allContacts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.full_name}{c.company ? ` — ${c.company}` : ''}
                  {' '}({c.contact_type === 'buyer' ? 'Αγοραστής' : c.contact_type === 'contractor' ? 'Ανάδοχος' : c.contact_type === 'supplier' ? 'Προμηθευτής' : c.contact_type === 'agent' ? 'Μεσίτης' : c.contact_type})
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </div>

      {/* Advanced toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {showAdvanced ? 'Λιγότερα πεδία' : 'Περισσότερα πεδία (ημερομηνίες, χρηματοδότηση, όροι…)'}
        </button>

        <div className={`mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 ${showAdvanced ? '' : 'hidden'}`}>
            <FormField label="Λήξη Προσφοράς" hint="Μέχρι πότε ισχύει">
              <input {...register('expires_at')} type="date" className={inputClass} />
            </FormField>
            <FormField label="Ημ. Υπογραφής Συμβολαίου">
              <input {...register('signing_date')} type="date" className={inputClass} />
            </FormField>

            {isPurchase && (
              <>
                <FormField label="Αρραβώνας (€)">
                  <input {...register('earnest_money', { valueAsNumber: true })} type="number" className={inputClass} placeholder="10000" />
                </FormField>
                <FormField label="Ίδια Κεφάλαια (€)">
                  <input {...register('down_payment', { valueAsNumber: true })} type="number" className={inputClass} placeholder="80000" />
                </FormField>
                <FormField label="Χρηματοδότηση">
                  <select {...register('financing')} className={selectClass}>
                    <option value="">— Επιλέξτε —</option>
                    {FINANCING_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </FormField>
                <FormField label="Due Diligence (ημέρες)">
                  <input {...register('due_diligence_days', { valueAsNumber: true })} type="number" className={inputClass} placeholder="10" />
                </FormField>
                <FormField label="Μεσίτης Αγοραστή">
                  <select {...register('buyer_agent_id')} className={selectClass}>
                    <option value="">— Επιλέξτε —</option>
                    {agents.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                  </select>
                </FormField>
                <FormField label="Μεσίτης Πωλητή">
                  <select {...register('seller_agent_id')} className={selectClass}>
                    <option value="">— Επιλέξτε —</option>
                    {agents.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                  </select>
                </FormField>
                <FormField label="Συμβολαιογράφος">
                  <select {...register('notary_id')} className={selectClass}>
                    <option value="">— Επιλέξτε —</option>
                    {notaries.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                  </select>
                </FormField>
              </>
            )}

            <div className="sm:col-span-2">
              <FormField label="Ειδικοί Όροι" hint="π.χ. Τακτοποίηση αυθαιρέτων, καθαρός τίτλος">
                <textarea {...register('special_terms')} className={inputClass} rows={2} />
              </FormField>
            </div>
            <div className="sm:col-span-2">
              <FormField label="Εσωτερικές Σημειώσεις" hint="Ορατό μόνο στην ομάδα">
                <textarea {...register('internal_notes')} className={inputClass} rows={2} />
              </FormField>
            </div>
          </div>
        </div>
      </div>

      <FormField label="Συνημμένα / Φωτογραφίες">
        <InlinePhotoPicker onChange={onPhotosChange ?? (() => {})} />
      </FormField>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} type="button">Ακύρωση</Button>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? 'Αποθήκευση…' : 'Αποθήκευση'}
        </Button>
      </div>
    </form>
  )
}
