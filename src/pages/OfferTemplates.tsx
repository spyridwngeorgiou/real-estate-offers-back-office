import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Topbar } from '../components/layout/Topbar'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { FormField, inputClass, selectClass } from '../components/ui/FormField'
import { useOfferTemplates, useCreateOfferTemplate, useUpdateOfferTemplate, useDeleteOfferTemplate } from '../hooks/useOfferTemplates'
import { useUIStore } from '../store/uiStore'
import { fmtMoney, fmtDate, OFFER_CATEGORY_LABELS } from '../lib/utils'
import type { OfferTemplate } from '../types'

interface TemplateFormValues {
  name: string
  category: string
  offer_price: string
  vat_rate: string
  vat_included: boolean
  payment_terms: string
  notes: string
}

function TemplateForm({ initial, onSubmit, onCancel, loading }: {
  initial?: Partial<OfferTemplate>
  onSubmit: (v: TemplateFormValues) => Promise<void>
  onCancel: () => void
  loading?: boolean
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<TemplateFormValues>({
    defaultValues: {
      name: initial?.name ?? '',
      category: initial?.category ?? '',
      offer_price: initial?.offer_price != null ? String(initial.offer_price) : '',
      vat_rate: initial?.vat_rate != null ? String(initial.vat_rate) : '',
      vat_included: initial?.vat_included ?? false,
      payment_terms: initial?.payment_terms ?? '',
      notes: initial?.notes ?? '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Όνομα Προτύπου" required error={errors.name?.message}>
        <input {...register('name', { required: 'Απαιτείται όνομα' })} className={inputClass} placeholder="π.χ. Τυπική Προσφορά Αγοράς" />
      </FormField>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Κατηγορία">
          <select {...register('category')} className={selectClass}>
            <option value="">— Επιλέξτε —</option>
            {Object.entries(OFFER_CATEGORY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Τιμή Προσφοράς (€)">
          <input {...register('offer_price')} type="number" className={inputClass} placeholder="300000" />
        </FormField>
        <FormField label="ΦΠΑ (%)">
          <input {...register('vat_rate')} type="number" step="0.01" className={inputClass} placeholder="24" />
        </FormField>
        <div className="flex items-center gap-2 pt-6">
          <input {...register('vat_included')} type="checkbox" id="tpl_vat_included" className="rounded border-slate-300 w-4 h-4 accent-blue-600" />
          <label htmlFor="tpl_vat_included" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none">Τιμή με ΦΠΑ</label>
        </div>
      </div>
      <FormField label="Όροι Πληρωμής">
        <textarea {...register('payment_terms')} rows={2} className={inputClass} placeholder="π.χ. 10% αρραβώνας, 30% προκαταβολή, υπόλοιπο κατά τη συμβολαιοποίηση" />
      </FormField>
      <FormField label="Σημειώσεις">
        <textarea {...register('notes')} rows={2} className={inputClass} />
      </FormField>
      <div className="flex justify-end gap-3 pt-1">
        <Button variant="secondary" type="button" onClick={onCancel}>Ακύρωση</Button>
        <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Αποθήκευση…' : 'Αποθήκευση'}</Button>
      </div>
    </form>
  )
}

export function OfferTemplates() {
  const { data: templates = [], isLoading } = useOfferTemplates()
  const createTemplate = useCreateOfferTemplate()
  const updateTemplate = useUpdateOfferTemplate()
  const deleteTemplate = useDeleteOfferTemplate()
  const addToast = useUIStore(s => s.addToast)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<OfferTemplate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<OfferTemplate | null>(null)

  async function handleSubmit(values: TemplateFormValues) {
    const payload = {
      name: values.name,
      category: values.category || null,
      offer_price: values.offer_price ? parseFloat(values.offer_price) : null,
      vat_rate: values.vat_rate ? parseFloat(values.vat_rate) : null,
      vat_included: values.vat_included,
      payment_terms: values.payment_terms || null,
      notes: values.notes || null,
      status: null,
    }
    if (editing) {
      await updateTemplate.mutateAsync({ id: editing.id, values: payload })
      addToast('Πρότυπο ενημερώθηκε', 'success')
    } else {
      await createTemplate.mutateAsync(payload)
      addToast('Πρότυπο δημιουργήθηκε', 'success')
    }
    setModalOpen(false)
    setEditing(null)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteTemplate.mutateAsync(deleteTarget.id)
    addToast('Πρότυπο διαγράφηκε', 'info')
    setDeleteTarget(null)
  }

  return (
    <div>
      <Topbar title="Πρότυπα Προσφορών" actions={
        <Button variant="primary" size="sm" onClick={() => { setEditing(null); setModalOpen(true) }}>
          <Plus size={15} /> Νέο Πρότυπο
        </Button>
      } />

      <div className="p-4 lg:p-6">
        {isLoading
          ? <p className="text-slate-400 dark:text-slate-500 text-sm">Φόρτωση…</p>
          : templates.length === 0
            ? (
              <div className="text-center py-20 text-slate-400 dark:text-slate-500">
                <p className="text-lg font-medium mb-2">Δεν υπάρχουν πρότυπα</p>
                <p className="text-sm mb-6">Αποθηκεύστε τυπικούς όρους προσφοράς για γρήγορη εφαρμογή.</p>
                <Button variant="primary" onClick={() => { setEditing(null); setModalOpen(true) }}>
                  <Plus size={15} /> Νέο Πρότυπο
                </Button>
              </div>
            )
            : (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                      <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Όνομα</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase hidden sm:table-cell">Κατηγορία</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase hidden md:table-cell">Τιμή</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase hidden lg:table-cell">Δημιουργήθηκε</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map(t => (
                      <tr key={t.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">{t.name}</td>
                        <td className="px-5 py-3 text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                          {t.category ? (OFFER_CATEGORY_LABELS[t.category as keyof typeof OFFER_CATEGORY_LABELS] ?? t.category) : '—'}
                        </td>
                        <td className="px-5 py-3 text-slate-700 dark:text-slate-300 hidden md:table-cell">{fmtMoney(t.offer_price)}</td>
                        <td className="px-5 py-3 text-slate-400 dark:text-slate-500 hidden lg:table-cell">{fmtDate(t.created_at)}</td>
                        <td className="px-5 py-3">
                          <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => { setEditing(t); setModalOpen(true) }}><Edit size={14} /></Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(t)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        }
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }}
        title={editing ? 'Επεξεργασία Προτύπου' : 'Νέο Πρότυπο Προσφοράς'} size="md">
        <TemplateForm
          initial={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => { setModalOpen(false); setEditing(null) }}
          loading={createTemplate.isPending || updateTemplate.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Διαγραφή Προτύπου"
        message={`Διαγραφή "${deleteTarget?.name}"; Η ενέργεια είναι μόνιμη.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
