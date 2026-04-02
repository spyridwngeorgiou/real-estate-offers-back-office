import { useForm } from 'react-hook-form'
import { FormField, inputClass, selectClass } from '../ui/FormField'
import { Button } from '../ui/Button'
import { useProperties } from '../../hooks/useProperties'
import { useContacts } from '../../hooks/useContacts'
import { FINANCING_OPTIONS } from '../../lib/utils'
import type { Offer } from '../../types'

interface OfferFormProps {
  initial?: Partial<Offer>
  prePropertyId?: string
  onSubmit: (values: any) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function OfferForm({ initial, prePropertyId, onSubmit, onCancel, loading }: OfferFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      ...initial,
      property_id: initial?.property_id ?? prePropertyId ?? '',
      offer_date: initial?.offer_date ?? new Date().toISOString().slice(0, 10),
      status: initial?.status ?? 'pending',
    }
  })

  const { data: properties = [] } = useProperties()
  const { data: buyers = [] } = useContacts({ type: 'buyer' })
  const { data: agents = [] } = useContacts({ type: 'agent' })
  const { data: notaries = [] } = useContacts({ type: 'notary' })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <FormField label="Ακίνητο" required error={errors.property_id?.message as string}>
            <select {...register('property_id', { required: 'Απαιτείται' })} className={selectClass}>
              <option value="">— Επιλέξτε Ακίνητο —</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.address}{p.city ? `, ${p.city}` : ''}</option>)}
            </select>
          </FormField>
        </div>

        <FormField label="Αγοραστής">
          <select {...register('buyer_id')} className={selectClass}>
            <option value="">— Επιλέξτε —</option>
            {buyers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
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

        <FormField label="Τιμή Προσφοράς (€)" required error={errors.offer_price?.message as string}>
          <input {...register('offer_price', { required: 'Απαιτείται', valueAsNumber: true })} type="number" className={inputClass} placeholder="305000" />
        </FormField>
        <FormField label="Προκαταβολή / Αρραβώνας (€)">
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
        <FormField label="Ημερομηνία Προσφοράς" required>
          <input {...register('offer_date', { required: true })} type="date" className={inputClass} />
        </FormField>
        <FormField label="Λήξη Προσφοράς">
          <input {...register('expires_at')} type="date" className={inputClass} />
        </FormField>
        <FormField label="Ημ. Υπογραφής Συμβολαίου">
          <input {...register('signing_date')} type="date" className={inputClass} />
        </FormField>
        <FormField label="Due Diligence (ημέρες)">
          <input {...register('due_diligence_days', { valueAsNumber: true })} type="number" className={inputClass} placeholder="10" />
        </FormField>
      </div>

      <FormField label="Ειδικοί Όροι">
        <textarea {...register('special_terms')} className={inputClass} rows={2} placeholder="π.χ. Τακτοποίηση αυθαιρέτων, καθαρός τίτλος…" />
      </FormField>
      <FormField label="Εσωτερικές Σημειώσεις" hint="Ορατό μόνο στην ομάδα">
        <textarea {...register('internal_notes')} className={inputClass} rows={2} placeholder="…" />
      </FormField>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} type="button">Ακύρωση</Button>
        <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Αποθήκευση…' : 'Αποθήκευση'}</Button>
      </div>
    </form>
  )
}
