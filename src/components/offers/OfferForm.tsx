import { useState, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { ChevronDown, ChevronUp, MapPin, Euro, Maximize2, ClipboardList, BookmarkPlus } from 'lucide-react'
import { FormField, inputClass, selectClass } from '../ui/FormField'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { InlinePhotoPicker } from '../ui/InlinePhotoPicker'
import { useProperties } from '../../hooks/useProperties'
import { useContacts } from '../../hooks/useContacts'
import { useOfferTemplates, useCreateOfferTemplate } from '../../hooks/useOfferTemplates'
import { FINANCING_OPTIONS, OFFER_CATEGORY_LABELS, fmtMoney, pricePerSqm, PROPERTY_TYPE_LABELS } from '../../lib/utils'
import type { Offer, OfferTemplate } from '../../types'

interface OfferFormProps {
  initial?: Partial<Offer>
  prePropertyId?: string
  onSubmit: (values: any) => Promise<void>
  onCancel: () => void
  loading?: boolean
  onPhotosChange?: (files: File[]) => void
  onDirtyChange?: (dirty: boolean) => void
}

const WORK_CATEGORIES = ['electrical', 'plumbing', 'hvac', 'structural', 'insulation',
  'flooring', 'painting', 'windows', 'roofing', 'finishing', 'equipment',
  'renovation_full', 'renovation_partial']

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
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')

  const { data: offerTemplates = [] } = useOfferTemplates()
  const createOfferTemplate = useCreateOfferTemplate()

  const { register, handleSubmit, control, reset, getValues, formState: { errors, isDirty, dirtyFields } } = useForm({
    defaultValues: {
      ...initial,
      property_id: initial?.property_id ?? prePropertyId ?? '',
      offer_date: initial?.offer_date ?? new Date().toISOString().slice(0, 10),
      status: initial?.status ?? 'pending',
      category: (initial as any)?.category ?? '',
      contact_person_id: (initial as any)?.buyer_id ?? (initial as any)?.contractor_id ?? '',
      vat_rate: initial?.vat_rate ?? null,
      vat_included: initial?.vat_included ?? false,
    }
  })

  useEffect(() => { onDirtyChange?.(isDirty) }, [isDirty])

  const category = useWatch({ control, name: 'category' })
  const selectedPropertyId = useWatch({ control, name: 'property_id' })
  const offerPrice = useWatch({ control, name: 'offer_price' })
  const vatRate = useWatch({ control, name: 'vat_rate' })
  const vatIncluded = useWatch({ control, name: 'vat_included' })
  const isPurchase = !category || category === 'purchase' || category === 'rental'
  const isWork = WORK_CATEGORIES.includes(category)

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
    // Exclude joined relation objects that come from the Supabase select
    const RELATIONS = ['property', 'buyer', 'contractor', 'buyer_agent', 'seller_agent', 'notary', 'counter_offers', 'id', 'created_at', 'updated_at']
    const REQUIRED = ['property_id', 'offer_price', 'offer_date', 'status']

    const values: any = {}
    for (const f of REQUIRED) values[f] = rest[f]

    // Always set contact fields
    values.buyer_id = field === 'buyer_id' ? contact_person_id || null : null
    values.contractor_id = field === 'contractor_id' ? contact_person_id || null : null

    // All other scalar fields: coerce empty→null, skip untouched when editing
    for (const f of Object.keys(rest).filter(k => !REQUIRED.includes(k) && !RELATIONS.includes(k))) {
      if (isEditing && !dirtyFields[f as keyof typeof dirtyFields]) continue
      values[f] = nullIfEmpty(rest[f])
    }

    await onSubmit(values)
  }

  function applyTemplate(t: OfferTemplate) {
    const current = getValues()
    reset({
      ...current,
      category: t.category ?? current.category,
      offer_price: t.offer_price ?? current.offer_price,
      vat_rate: t.vat_rate ?? current.vat_rate,
      vat_included: t.vat_included,
      special_terms: t.payment_terms ?? current.special_terms,
      internal_notes: t.notes ?? current.internal_notes,
    })
    setTemplatePickerOpen(false)
  }

  async function saveAsTemplate() {
    if (!newTemplateName.trim()) return
    const vals = getValues()
    await createOfferTemplate.mutateAsync({
      name: newTemplateName.trim(),
      category: vals.category || null,
      offer_price: vals.offer_price ? Number(vals.offer_price) : null,
      vat_rate: vals.vat_rate ? Number(vals.vat_rate) : null,
      vat_included: vals.vat_included ?? false,
      payment_terms: (vals as any).special_terms || null,
      notes: (vals as any).internal_notes || null,
      status: null,
    })
    setNewTemplateName('')
    setSaveTemplateOpen(false)
  }

  return (
    <form onSubmit={handleSubmit(handleSubmitWrapped)} className="space-y-5">

      {/* Template actions */}
      <div className="flex gap-2 pb-1 border-b border-slate-100 dark:border-slate-700">
        <Button type="button" variant="secondary" size="sm" onClick={() => setTemplatePickerOpen(true)} disabled={offerTemplates.length === 0}>
          <ClipboardList size={14} /> Φόρτωση Προτύπου
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setSaveTemplateOpen(true)}>
          <BookmarkPlus size={14} /> Αποθήκευση ως Πρότυπο
        </Button>
      </div>

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

        {/* VAT fields — shown for work/renovation categories */}
        <div className={`sm:col-span-2 ${isWork ? '' : 'hidden'}`}>
          <div className="flex flex-wrap items-end gap-4 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
            <FormField label="Συντελεστής ΦΠΑ (%)" hint="Αφήστε κενό αν δεν ισχύει ΦΠΑ">
              <input
                {...register('vat_rate', { valueAsNumber: true })}
                type="number" min="0" max="100" step="1"
                className={inputClass + ' w-28'}
                placeholder="24"
              />
            </FormField>
            <div className="flex items-center gap-2 pb-1">
              <input {...register('vat_included')} type="checkbox" id="vat_included" className="rounded border-slate-300 w-4 h-4" />
              <label htmlFor="vat_included" className="text-sm text-slate-700 select-none cursor-pointer">Η τιμή περιλαμβάνει ήδη ΦΠΑ</label>
            </div>
            {vatRate && !isNaN(Number(vatRate)) && Number(vatRate) > 0 && offerPrice != null && offerPrice > 0 && (
              <div className="text-sm font-semibold text-amber-800">
                {vatIncluded
                  ? <>Καθαρή αξία: <span className="text-amber-900">{fmtMoney(Math.round((offerPrice as number) / (1 + Number(vatRate) / 100)))}</span></>
                  : <>Τελική με ΦΠΑ: <span className="text-amber-900">{fmtMoney(Math.round((offerPrice as number) * (1 + Number(vatRate) / 100)))}</span></>
                }
              </div>
            )}
          </div>
        </div>

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

      <FormField label="Συνημμένα / Φωτογραφίες">
        <InlinePhotoPicker onChange={onPhotosChange ?? (() => {})} />
      </FormField>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} type="button">Ακύρωση</Button>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? 'Αποθήκευση…' : 'Αποθήκευση'}
        </Button>
      </div>

      {/* Template picker */}
      <Modal open={templatePickerOpen} onClose={() => setTemplatePickerOpen(false)} title="Φόρτωση Προτύπου" size="sm">
        <div className="space-y-2">
          {offerTemplates.map(t => (
            <button key={t.id} onClick={() => applyTemplate(t)}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 transition-colors">
              <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">{t.name}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {t.category ? (OFFER_CATEGORY_LABELS[t.category as keyof typeof OFFER_CATEGORY_LABELS] ?? t.category) : ''}
                {t.offer_price ? ` · ${fmtMoney(t.offer_price)}` : ''}
              </p>
            </button>
          ))}
        </div>
      </Modal>

      {/* Save as template */}
      <Modal open={saveTemplateOpen} onClose={() => setSaveTemplateOpen(false)} title="Αποθήκευση ως Πρότυπο" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Εισάγετε όνομα για το νέο πρότυπο.</p>
          <input
            value={newTemplateName}
            onChange={e => setNewTemplateName(e.target.value)}
            placeholder="π.χ. Τυπική Προσφορά Αγοράς"
            className={inputClass}
            onKeyDown={e => e.key === 'Enter' && saveAsTemplate()}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setSaveTemplateOpen(false)}>Ακύρωση</Button>
            <Button variant="primary" type="button" onClick={saveAsTemplate}
              disabled={!newTemplateName.trim() || createOfferTemplate.isPending}>
              {createOfferTemplate.isPending ? 'Αποθήκευση…' : 'Αποθήκευση'}
            </Button>
          </div>
        </div>
      </Modal>
    </form>
  )
}
