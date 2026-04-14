import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Edit, Trash2, Copy } from 'lucide-react'
import { Topbar } from '../components/layout/Topbar'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { FormField, inputClass } from '../components/ui/FormField'
import { useEmailTemplates, useCreateEmailTemplate, useUpdateEmailTemplate, useDeleteEmailTemplate } from '../hooks/useEmailTemplates'
import { useUIStore } from '../store/uiStore'
import { fmtDate } from '../lib/utils'
import type { EmailTemplate } from '../types'

interface TemplateFormValues {
  name: string
  subject: string
  body: string
}

function TemplateForm({ initial, onSubmit, onCancel, loading }: {
  initial?: Partial<EmailTemplate>
  onSubmit: (v: TemplateFormValues) => Promise<void>
  onCancel: () => void
  loading?: boolean
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<TemplateFormValues>({
    defaultValues: { name: initial?.name ?? '', subject: initial?.subject ?? '', body: initial?.body ?? '' },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Όνομα Προτύπου" required error={errors.name?.message}>
        <input {...register('name', { required: 'Απαιτείται όνομα' })} className={inputClass} placeholder="π.χ. Επιστολή Προσφοράς" />
      </FormField>
      <FormField label="Θέμα Email" error={errors.subject?.message}>
        <input {...register('subject')} className={inputClass} placeholder="π.χ. Προσφορά για το ακίνητο στην..." />
      </FormField>
      <FormField label="Κείμενο" required error={errors.body?.message}>
        <textarea
          {...register('body', { required: 'Απαιτείται κείμενο' })}
          rows={10}
          className={inputClass}
          placeholder="Αγαπητέ/ή..."
        />
      </FormField>
      <div className="flex justify-end gap-3 pt-1">
        <Button variant="secondary" type="button" onClick={onCancel}>Ακύρωση</Button>
        <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Αποθήκευση…' : 'Αποθήκευση'}</Button>
      </div>
    </form>
  )
}

export function EmailTemplates() {
  const { data: templates = [], isLoading } = useEmailTemplates()
  const createTemplate = useCreateEmailTemplate()
  const updateTemplate = useUpdateEmailTemplate()
  const deleteTemplate = useDeleteEmailTemplate()
  const addToast = useUIStore(s => s.addToast)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<EmailTemplate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EmailTemplate | null>(null)
  const [preview, setPreview] = useState<EmailTemplate | null>(null)

  async function handleSubmit(values: TemplateFormValues) {
    try {
      if (editing) {
        await updateTemplate.mutateAsync({ id: editing.id, values })
        addToast('Πρότυπο ενημερώθηκε', 'success')
      } else {
        await createTemplate.mutateAsync({ name: values.name, subject: values.subject || null, body: values.body })
        addToast('Πρότυπο δημιουργήθηκε', 'success')
      }
      setModalOpen(false)
      setEditing(null)
    } catch (err: any) {
      console.error('Error saving template:', err)
      addToast(err.message || 'Σφάλμα κατά την αποθήκευση', 'error')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteTemplate.mutateAsync(deleteTarget.id)
      addToast('Πρότυπο διαγράφηκε', 'info')
      setDeleteTarget(null)
    } catch (err: any) {
      console.error('Error deleting template:', err)
      addToast(err.message || 'Σφάλμα κατά τη διαγραφή', 'error')
    }
  }

  function handleUse(t: EmailTemplate) {
    const text = [t.subject ? `Θέμα: ${t.subject}\n\n` : '', t.body].join('')
    navigator.clipboard.writeText(text).then(() => addToast('Αντιγράφηκε στο πρόχειρο', 'success'))
  }

  return (
    <div>
      <Topbar title="Πρότυπα Email" actions={
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
                <p className="text-sm mb-6">Δημιουργήστε πρότυπα email για επαναχρησιμοποίηση.</p>
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
                      <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase hidden sm:table-cell">Θέμα</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase hidden md:table-cell">Δημιουργήθηκε</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map(t => (
                      <tr key={t.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">
                          <button className="hover:underline text-left" onClick={() => setPreview(t)}>{t.name}</button>
                        </td>
                        <td className="px-5 py-3 text-slate-500 dark:text-slate-400 truncate max-w-xs hidden sm:table-cell">{t.subject ?? '—'}</td>
                        <td className="px-5 py-3 text-slate-400 dark:text-slate-500 hidden md:table-cell">{fmtDate(t.created_at)}</td>
                        <td className="px-5 py-3">
                          <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => handleUse(t)}><Copy size={14} /> Αντιγραφή</Button>
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
        title={editing ? 'Επεξεργασία Προτύπου' : 'Νέο Πρότυπο Email'} size="lg">
        <TemplateForm
          initial={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => { setModalOpen(false); setEditing(null) }}
          loading={createTemplate.isPending || updateTemplate.isPending}
        />
      </Modal>

      {/* Preview modal */}
      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.name ?? ''} size="lg">
        {preview && (
          <div className="space-y-4">
            {preview.subject && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Θέμα</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{preview.subject}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Κείμενο</p>
              <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg max-h-80 overflow-y-auto">{preview.body}</pre>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <Button variant="secondary" onClick={() => setPreview(null)}>Κλείσιμο</Button>
              <Button variant="primary" onClick={() => { handleUse(preview); setPreview(null) }}><Copy size={14} /> Αντιγραφή</Button>
            </div>
          </div>
        )}
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
