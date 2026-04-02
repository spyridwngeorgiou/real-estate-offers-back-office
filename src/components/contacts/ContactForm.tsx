import { useForm } from 'react-hook-form'
import { FormField, inputClass, selectClass } from '../ui/FormField'
import { Button } from '../ui/Button'
import { InlinePhotoPicker } from '../ui/InlinePhotoPicker'
import type { Contact } from '../../types'

interface ContactFormProps {
  initial?: Partial<Contact>
  onSubmit: (values: any) => Promise<void>
  onCancel: () => void
  loading?: boolean
  onPhotosChange?: (files: File[]) => void
}

export function ContactForm({ initial, onSubmit, onCancel, loading, onPhotosChange }: ContactFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: initial ?? {} })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <FormField label="Ονοματεπώνυμο" required error={errors.full_name?.message as string}>
            <input {...register('full_name', { required: 'Απαιτείται' })} className={inputClass} placeholder="π.χ. Γιάννης Παπαδόπουλος" />
          </FormField>
        </div>

        <FormField label="Τύπος Επαφής">
          <select {...register('contact_type')} className={selectClass}>
            <option value="buyer">Αγοραστής</option>
            <option value="seller">Πωλητής</option>
            <option value="agent">Μεσίτης</option>
            <option value="notary">Συμβολαιογράφος</option>
            <option value="lawyer">Δικηγόρος</option>
            <option value="other">Άλλο</option>
          </select>
        </FormField>
        <FormField label="Εταιρεία">
          <input {...register('company')} className={inputClass} placeholder="π.χ. ERA Real Estate" />
        </FormField>

        <FormField label="Email">
          <input {...register('email')} type="email" className={inputClass} placeholder="email@example.com" />
        </FormField>
        <FormField label="Τηλέφωνο">
          <input {...register('phone')} className={inputClass} placeholder="+30 21 0000 0000" />
        </FormField>
        <FormField label="Κινητό">
          <input {...register('mobile')} className={inputClass} placeholder="+30 69 0000 0000" />
        </FormField>
        <FormField label="Αριθμός Άδειας (μεσίτες)">
          <input {...register('license_no')} className={inputClass} placeholder="ΑΡ-12345" />
        </FormField>
        <FormField label="ΑΦΜ">
          <input {...register('tax_id')} className={inputClass} placeholder="123456789" />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="Διεύθυνση">
            <input {...register('address')} className={inputClass} placeholder="Οδός, Αριθμός, Πόλη" />
          </FormField>
        </div>
        <div className="sm:col-span-2">
          <FormField label="Σημειώσεις">
            <textarea {...register('notes')} className={inputClass} rows={3} placeholder="Επιπλέον πληροφορίες…" />
          </FormField>
        </div>
      </div>

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
