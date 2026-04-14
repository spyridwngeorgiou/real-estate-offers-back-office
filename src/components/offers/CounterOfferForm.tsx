import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../ui/Button'
import { FormField, inputClass, selectClass } from '../ui/FormField'
import { fmtMoney } from '../../lib/utils'

const schema = z.object({
  counter_price: z.coerce.number({ invalid_type_error: 'Απαιτείται τιμή' }).positive('Η τιμή πρέπει να είναι θετική'),
  from_party: z.enum(['seller', 'buyer']),
  notes: z.string().optional(),
})

export type CounterOfferValues = z.infer<typeof schema>

interface CounterOfferFormProps {
  round: number
  originalPrice: number
  onSubmit: (values: CounterOfferValues) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function CounterOfferForm({ round, originalPrice, onSubmit, onCancel, loading }: CounterOfferFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<CounterOfferValues>({
    resolver: zodResolver(schema),
    defaultValues: { from_party: 'seller' },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">
        Αρχική τιμή προσφοράς: <span className="font-semibold text-slate-700 dark:text-slate-300">{fmtMoney(originalPrice)}</span>
      </p>

      <FormField label={`Τιμή Αντιπροσφοράς — Γύρος ${round} (€)`} required error={errors.counter_price?.message}>
        <input
          type="number"
          {...register('counter_price')}
          placeholder="290000"
          className={inputClass}
        />
      </FormField>

      <FormField label="Από" error={errors.from_party?.message}>
        <select {...register('from_party')} className={selectClass}>
          <option value="seller">Πωλητής</option>
          <option value="buyer">Αγοραστής</option>
        </select>
      </FormField>

      <FormField label="Σημειώσεις" error={errors.notes?.message}>
        <textarea
          {...register('notes')}
          rows={3}
          className={inputClass}
        />
      </FormField>

      <div className="flex justify-end gap-3 pt-1">
        <Button variant="secondary" onClick={onCancel} type="button">Ακύρωση</Button>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? 'Αποθήκευση…' : 'Αποθήκευση'}
        </Button>
      </div>
    </form>
  )
}
