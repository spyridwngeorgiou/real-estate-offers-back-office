import { useForm } from 'react-hook-form'
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
}

export function PropertyForm({ initial, onSubmit, onCancel, loading, onPhotosChange }: PropertyFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: initial ?? {} })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <FormField label="Διεύθυνση" required error={errors.address?.message as string}>
            <input {...register('address', { required: 'Απαιτείται' })} className={inputClass} placeholder="π.χ. Βασ. Γεωργίου 14" />
          </FormField>
        </div>
        <FormField label="Πόλη"><input {...register('city')} className={inputClass} placeholder="π.χ. Αθήνα" /></FormField>
        <FormField label="Περιοχή / Γειτονιά"><input {...register('neighborhood')} className={inputClass} placeholder="π.χ. Γλυφάδα" /></FormField>
        <FormField label="ΤΚ"><input {...register('postal_code')} className={inputClass} placeholder="π.χ. 16675" /></FormField>
        <FormField label="Κωδικός Καταχώρισης"><input {...register('listing_code')} className={inputClass} placeholder="SP-112233" /></FormField>

        <FormField label="Τύπος">
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
            <option value="expired">Έληξε</option>
            <option value="off_market">Εκτός Αγοράς</option>
          </select>
        </FormField>

        <FormField label="Τιμή Πώλησης (€)" error={errors.list_price?.message as string}>
          <input {...register('list_price', { valueAsNumber: true })} type="number" className={inputClass} placeholder="320000" />
        </FormField>
        <FormField label="Εμβαδόν (τ.μ.)">
          <input {...register('sqm', { valueAsNumber: true })} type="number" step="0.01" className={inputClass} placeholder="95" />
        </FormField>
        <FormField label="Εμβαδόν Οικοπέδου (τ.μ.)">
          <input {...register('plot_sqm', { valueAsNumber: true })} type="number" step="0.01" className={inputClass} placeholder="Μόνο για οικόπεδα/βίλες" />
        </FormField>
        <FormField label="Υπνοδωμάτια">
          <input {...register('bedrooms', { valueAsNumber: true })} type="number" className={inputClass} placeholder="3" />
        </FormField>
        <FormField label="Μπάνια">
          <input {...register('bathrooms', { valueAsNumber: true })} type="number" step="0.5" className={inputClass} placeholder="2" />
        </FormField>
        <FormField label="Όροφος">
          <select {...register('floor')} className={selectClass}>
            <option value="">—</option>
            {FLOOR_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </FormField>
        <FormField label="Έτος Κατασκευής">
          <input {...register('year_built', { valueAsNumber: true })} type="number" className={inputClass} placeholder="1998" />
        </FormField>
        <FormField label="Ενεργειακή Κλάση">
          <select {...register('energy_rating')} className={selectClass}>
            <option value="">—</option>
            {ENERGY_RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </FormField>
        <FormField label="Κοινόχρηστα (€/μήνα)">
          <input {...register('common_expenses', { valueAsNumber: true })} type="number" className={inputClass} placeholder="150" />
        </FormField>
        <FormField label="Ημερομηνία Καταχώρισης">
          <input {...register('listing_date')} type="date" className={inputClass} />
        </FormField>
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input {...register('has_parking')} type="checkbox" className="w-4 h-4 rounded text-blue-600" />
          Θέση Στάθμευσης
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input {...register('has_storage')} type="checkbox" className="w-4 h-4 rounded text-blue-600" />
          Αποθηκευτικός Χώρος
        </label>
      </div>

      <FormField label="Περιγραφή">
        <textarea {...register('description')} className={inputClass} rows={3} placeholder="Σύντομη περιγραφή ακινήτου…" />
      </FormField>

      <FormField label="Φωτογραφίες">
        <InlinePhotoPicker onChange={onPhotosChange ?? (() => {})} />
      </FormField>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} type="button">Ακύρωση</Button>
        <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Αποθήκευση…' : 'Αποθήκευση'}</Button>
      </div>
    </form>
  )
}
