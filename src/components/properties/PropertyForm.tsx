import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { FormField, inputClass, selectClass } from '../ui/FormField'
import { Button } from '../ui/Button'
import { InlinePhotoPicker } from '../ui/InlinePhotoPicker'
import { FLOOR_OPTIONS, ENERGY_RATINGS } from '../../lib/utils'
import type { Property } from '../../types'

interface PropertyFormProps {
  initial?: Partial<Property>
  onSubmit: (values: any) => Promise<void>
  onCancel: () => void
  loading?: boolean
  onPhotosChange?: (files: File[]) => void
  onDirtyChange?: (dirty: boolean) => void
}

export function PropertyForm({ initial, onSubmit, onCancel, loading, onPhotosChange, onDirtyChange }: PropertyFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const { register, handleSubmit, formState: { errors, isDirty, dirtyFields } } = useForm({ defaultValues: initial ?? {} })
  useEffect(() => { onDirtyChange?.(isDirty) }, [isDirty])

  const isEditing = !!initial?.id
  function buildValues(raw: any) {
    if (!isEditing) return raw
    const nullIfEmpty = (v: any) => (v === '' || v === undefined || (typeof v === 'number' && isNaN(v)) ? null : v)
    const optional = ['city', 'neighborhood', 'postal_code', 'list_price', 'sqm', 'plot_sqm', 'bedrooms', 'bathrooms', 'floor', 'year_built', 'energy_rating', 'common_expenses', 'listing_code', 'listing_date', 'description']
    const result: any = { ...raw }
    for (const f of optional) {
      if (!dirtyFields[f as keyof typeof dirtyFields]) delete result[f]
      else result[f] = nullIfEmpty(result[f])
    }
    return result
  }

  return (
    <form onSubmit={handleSubmit(v => onSubmit(buildValues(v)))} className="space-y-5">
      {/* Essential fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <FormField label="Διεύθυνση" required error={errors.address?.message as string}
            hint="Οδός και αριθμός">
            <input {...register('address', { required: 'Η διεύθυνση είναι υποχρεωτική' })}
              className={inputClass} placeholder="π.χ. Βασ. Γεωργίου 14" />
          </FormField>
        </div>

        <FormField label="Πόλη">
          <input {...register('city')} className={inputClass} placeholder="π.χ. Αθήνα" />
        </FormField>
        <FormField label="Περιοχή / Γειτονιά">
          <input {...register('neighborhood')} className={inputClass} placeholder="π.χ. Γλυφάδα" />
        </FormField>

        <FormField label="Τύπος Ακινήτου">
          <select {...register('property_type')} className={selectClass}>
            <option value="apartment">Διαμέρισμα</option>
            <option value="maisonette">Μεζονέτα</option>
            <option value="villa">Βίλα</option>
            <option value="single_family">Μονοκατοικία</option>
            <option value="plot">Οικόπεδο</option>
            <option value="commercial">Επαγγελματικό</option>
            <option value="office">Γραφείο</option>
            <option value="other">Άλλο</option>
          </select>
        </FormField>

        <FormField label="Κατάσταση">
          <select {...register('status')} className={selectClass}>
            <option value="listed">Προς Πώληση</option>
            <option value="under_offer">Υπό Διαπραγμάτευση</option>
            <option value="sold">Πουλήθηκε</option>
            <option value="for_rent">Προς Ενοικίαση</option>
            <option value="rented">Ενοικιάστηκε</option>
            <option value="for_renovation">Προς Ανακαίνιση</option>
            <option value="under_renovation">Υπό Ανακαίνιση</option>
            <option value="expired">Έληξε</option>
            <option value="off_market">Εκτός Αγοράς</option>
          </select>
        </FormField>

        <FormField label="Τιμή Πώλησης (€)" hint="Ζητούμενη τιμή" error={errors.list_price?.message as string}>
          <input {...register('list_price', { valueAsNumber: true, min: { value: 1, message: 'Η τιμή πρέπει να είναι μεγαλύτερη από 0' } })}
            type="number" className={inputClass} placeholder="320000" />
        </FormField>

        <FormField label="Εμβαδόν (τ.μ.)" error={errors.sqm?.message as string}>
          <input {...register('sqm', { valueAsNumber: true, min: { value: 1, message: 'Το εμβαδόν πρέπει να είναι μεγαλύτερο από 0' } })}
            type="number" step="0.01" className={inputClass} placeholder="95" />
        </FormField>
      </div>

      {/* Advanced toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {showAdvanced ? 'Λιγότερα πεδία' : 'Περισσότερα πεδία (δωμάτια, όροφος, ενεργειακή κλάση…)'}
        </button>

        {showAdvanced && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <FormField label="ΤΚ">
              <input {...register('postal_code')} className={inputClass} placeholder="π.χ. 16675" />
            </FormField>
            <FormField label="Κωδικός Καταχώρισης" hint="Εσωτερικός κωδικός αγγελίας">
              <input {...register('listing_code')} className={inputClass} placeholder="SP-112233" />
            </FormField>
            <FormField label="Υπνοδωμάτια">
              <input {...register('bedrooms', { valueAsNumber: true })} type="number"
                className={inputClass} placeholder="3" />
            </FormField>
            <FormField label="Μπάνια">
              <input {...register('bathrooms', { valueAsNumber: true })} type="number" step="0.5"
                className={inputClass} placeholder="2" />
            </FormField>
            <FormField label="Όροφος">
              <select {...register('floor')} className={selectClass}>
                <option value="">—</option>
                {FLOOR_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </FormField>
            <FormField label="Έτος Κατασκευής">
              <input {...register('year_built', { valueAsNumber: true })} type="number"
                className={inputClass} placeholder="1998" />
            </FormField>
            <FormField label="Ενεργειακή Κλάση">
              <select {...register('energy_rating')} className={selectClass}>
                <option value="">—</option>
                {ENERGY_RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </FormField>
            <FormField label="Εμβαδόν Οικοπέδου (τ.μ.)" hint="Μόνο για οικόπεδα / βίλες">
              <input {...register('plot_sqm', { valueAsNumber: true })} type="number" step="0.01"
                className={inputClass} placeholder="500" />
            </FormField>
            <FormField label="Κοινόχρηστα (€/μήνα)">
              <input {...register('common_expenses', { valueAsNumber: true })} type="number"
                className={inputClass} placeholder="150" />
            </FormField>
            <FormField label="Ημερομηνία Καταχώρισης">
              <input {...register('listing_date')} type="date" className={inputClass} />
            </FormField>

            <div className="sm:col-span-2 flex gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input {...register('has_parking')} type="checkbox" className="w-4 h-4 rounded text-blue-600" />
                Θέση Στάθμευσης
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input {...register('has_storage')} type="checkbox" className="w-4 h-4 rounded text-blue-600" />
                Αποθηκευτικός Χώρος
              </label>
            </div>

            <div className="sm:col-span-2">
              <FormField label="Περιγραφή">
                <textarea {...register('description')} className={inputClass} rows={3}
                  placeholder="Σύντομη περιγραφή ακινήτου…" />
              </FormField>
            </div>
          </div>
        )}
      </div>

      <FormField label="Φωτογραφίες">
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
