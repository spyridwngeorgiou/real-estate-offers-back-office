import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { FormField, inputClass, selectClass } from '../ui/FormField'
import { Button } from '../ui/Button'
import { InlinePhotoPicker } from '../ui/InlinePhotoPicker'
import { useProperties } from '../../hooks/useProperties'
import { useContacts } from '../../hooks/useContacts'
import { FINANCING_OPTIONS, OFFER_CATEGORY_LABELS } from '../../lib/utils'
import type { Offer } from '../../types'

interface OfferFormProps {
  initial?: Partial<Offer>
  prePropertyId?: string
  onSubmit: (values: any) => Promise<void>
  onCancel: () => void
  loading?: boolean
  onPhotosChange?: (files: File[]) => void
}

const PURCHASE_CATEGORY = 'purchase'
const WORK_CATEGORIES = ['electrical', 'plumbing', 'hvac', 'structural', 'finishing', 'equipment']

export function OfferForm({ initial, prePropertyId, onSubmit, onCancel, loading, onPhotosChange }: OfferFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: {
      ...initial,
      property_id: initial?.property_id ?? prePropertyId ?? '',
      offer_date: initial?.offer_date ?? new Date().toISOString().slice(0, 10),
      status: initial?.status ?? 'pending',
      category: (initial as any)?.category ?? '',
    }
  })

  const category = useWatch({ control, name: 'category' })
  const isPurchase = !category || category === PURCHASE_CATEGORY
  const isWork = WORK_CATEGORIES.includes(category)

  const { data: properties = [] } = useProperties()
  const { data: buyers = [] } = useContacts({ type: 'buyer' })
  const { data: agents = [] } = useContacts({ type: 'agent' })
  const { data: notaries = [] } = useContacts({ type: 'notary' })
  const { data: suppliers = [] } = useContacts({ type: 'supplier' })
  const { data: contractors = [] } = useContacts({ type: 'contractor' })
  const contractorOptions = [...suppliers, ...contractors]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Step 1 — What kind of offer? */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Κατηγορία" hint="Τι αφορά η προσφορά;">
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

        <div className="sm:col-span-2">
          <FormField label="Ακίνητο" required error={errors.property_id?.message as string}>
            <select {...register('property_id', { required: 'Παρακαλώ επιλέξτε ακίνητο' })} className={selectClass}>
              <option value="">— Επιλέξτε Ακίνητο —</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.address}{p.city ? `, ${p.city}` : ''}</option>
              ))}
            </select>
          </FormField>
        </div>
      </div>

      {/* Step 2 — Price + Person */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Τιμή Προσφοράς (€)" required error={errors.offer_price?.message as string}
          hint="Ποσό σε ευρώ χωρίς κόμματα">
          <input
            {...register('offer_price', { required: 'Απαιτείται τιμή προσφοράς', valueAsNumber: true })}
            type="number" className={inputClass} placeholder="305000"
          />
        </FormField>

        <FormField label="Ημερομηνία Προσφοράς" required>
          <input {...register('offer_date', { required: true })} type="date" className={inputClass} />
        </FormField>

        {/* Show buyer for purchase or no category */}
        {!isWork && (
          <FormField label="Αγοραστής" hint="Προσθέστε τον αγοραστή από την καρτέλα Επαφές">
            <select {...register('buyer_id')} className={selectClass}>
              <option value="">— Επιλέξτε Αγοραστή —</option>
              {buyers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </FormField>
        )}

        {/* Show contractor for work categories or when explicitly work */}
        {!isPurchase && (
          <FormField label="Ανάδοχος / Τεχνίτης" hint="Προσθέστε τον ανάδοχο από την καρτέλα Επαφές">
            <select {...register('contractor_id')} className={selectClass}>
              <option value="">— Επιλέξτε Ανάδοχο —</option>
              {contractorOptions.map(c => (
                <option key={c.id} value={c.id}>{c.full_name}{c.company ? ` — ${c.company}` : ''}</option>
              ))}
            </select>
          </FormField>
        )}
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

        {showAdvanced && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <FormField label="Λήξη Προσφοράς" hint="Ημερομηνία μέχρι την οποία ισχύει">
              <input {...register('expires_at')} type="date" className={inputClass} />
            </FormField>
            <FormField label="Ημ. Υπογραφής Συμβολαίου">
              <input {...register('signing_date')} type="date" className={inputClass} />
            </FormField>

            {isPurchase && (
              <>
                <FormField label="Αρραβώνας (€)" hint="Ποσό προκαταβολής">
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
                <FormField label="Due Diligence (ημέρες)" hint="Πόσες μέρες έχει ο αγοραστής για έλεγχο">
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
        )}
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
