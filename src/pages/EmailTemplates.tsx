import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Edit, Trash2, Copy, Send, ChevronDown, ChevronUp } from 'lucide-react'
import { Topbar } from '../components/layout/Topbar'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { FormField, inputClass, selectClass } from '../components/ui/FormField'
import { useEmailTemplates, useCreateEmailTemplate, useUpdateEmailTemplate, useDeleteEmailTemplate } from '../hooks/useEmailTemplates'
import { useUIStore } from '../store/uiStore'
import { fmtDate } from '../lib/utils'
import { EMAIL_TEMPLATE_CATEGORIES, TEMPLATE_VARIABLES, substituteVars } from '../lib/templateUtils'
import { EmailSendModal } from '../components/shared/EmailSendModal'
import type { EmailTemplate } from '../types'

interface TemplateFormValues {
  name: string
  subject: string
  body: string
  category: string
}

function TemplateForm({ initial, onSubmit, onCancel, loading }: {
  initial?: Partial<EmailTemplate>
  onSubmit: (v: TemplateFormValues) => Promise<void>
  onCancel: () => void
  loading?: boolean
}) {
  const [showVars, setShowVars] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<TemplateFormValues>({
    defaultValues: {
      name: initial?.name ?? '',
      subject: initial?.subject ?? '',
      body: initial?.body ?? '',
      category: initial?.category ?? '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Όνομα Προτύπου" required error={errors.name?.message}>
          <input {...register('name', { required: 'Απαιτείται όνομα' })} className={inputClass} placeholder="π.χ. Επιστολή Προσφοράς" />
        </FormField>
        <FormField label="Κατηγορία">
          <select {...register('category')} className={selectClass}>
            <option value="">— Επιλέξτε —</option>
            {Object.entries(EMAIL_TEMPLATE_CATEGORIES).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </FormField>
      </div>
      <FormField label="Θέμα Email">
        <input {...register('subject')} className={inputClass} placeholder="π.χ. Προσφορά για το ακίνητο στην {{property_address}}" />
      </FormField>

      {/* Variables hint */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
        <button type="button" onClick={() => setShowVars(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <span className="font-medium">Διαθέσιμες μεταβλητές <span className="font-normal text-slate-400">(κλικ για αντιγραφή)</span></span>
          {showVars ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showVars && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-3 bg-white dark:bg-slate-800">
            {TEMPLATE_VARIABLES.map(v => (
              <button key={v.key} type="button"
                onClick={() => navigator.clipboard.writeText(`{{${v.key}}}`)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left transition-colors group">
                <code className="text-xs bg-slate-100 dark:bg-slate-700 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-mono group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40">
                  {`{{${v.key}}}`}
                </code>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{v.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <FormField label="Κείμενο" required error={errors.body?.message}>
        <textarea
          {...register('body', { required: 'Απαιτείται κείμενο' })}
          rows={10}
          className={inputClass}
          placeholder={'Αγαπητέ/ή {{contact_name}},\n\nΣας αποστέλλουμε την προσφορά μας ύψους {{offer_price}}...'}
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

  const [categoryFilter, setCategoryFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<EmailTemplate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EmailTemplate | null>(null)
  const [preview, setPreview] = useState<EmailTemplate | null>(null)
  const [sendTarget, setSendTarget] = useState<EmailTemplate | null>(null)

  const filtered = categoryFilter ? templates.filter(t => t.category === categoryFilter) : templates

  async function handleSubmit(values: TemplateFormValues) {
    try {
      const payload = {
        name: values.name,
        subject: values.subject || null,
        body: values.body,
        category: values.category || null,
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
    } catch (err: any) {
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
      addToast(err.message || 'Σφάλμα κατά τη διαγραφή', 'error')
    }
  }

  async function handleDuplicate(t: EmailTemplate) {
    try {
      await createTemplate.mutateAsync({
        name: `${t.name} (αντίγραφο)`,
        subject: t.subject,
        body: t.body,
        category: t.category,
      })
      addToast('Πρότυπο αντιγράφηκε', 'success')
    } catch (err: any) {
      addToast(err.message || 'Σφάλμα', 'error')
    }
  }

  function handleCopyText(t: EmailTemplate) {
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

      <div className="p-4 lg:p-6 space-y-4">
        {/* Category filter tabs */}
        {templates.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryFilter('')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!categoryFilter ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
            >
              Όλα ({templates.length})
            </button>
            {Object.entries(EMAIL_TEMPLATE_CATEGORIES).map(([val, label]) => {
              const count = templates.filter(t => t.category === val).length
              if (!count) return null
              return (
                <button key={val}
                  onClick={() => setCategoryFilter(val)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${categoryFilter === val ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                >
                  {label} ({count})
                </button>
              )
            })}
          </div>
        )}

        {isLoading
          ? <p className="text-slate-400 dark:text-slate-500 text-sm">Φόρτωση…</p>
          : filtered.length === 0
            ? (
              <div className="text-center py-20 text-slate-400 dark:text-slate-500">
                <p className="text-lg font-medium mb-2">Δεν υπάρχουν πρότυπα</p>
                <p className="text-sm mb-6">Δημιουργήστε πρότυπα email για επαναχρησιμοποίηση με αυτόματη συμπλήρωση μεταβλητών.</p>
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
                      <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase hidden md:table-cell">Θέμα</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase hidden lg:table-cell">Δημιουργήθηκε</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(t => (
                      <tr key={t.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">
                          <button className="hover:underline text-left" onClick={() => setPreview(t)}>{t.name}</button>
                        </td>
                        <td className="px-5 py-3 hidden sm:table-cell">
                          {t.category
                            ? <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">{EMAIL_TEMPLATE_CATEGORIES[t.category] ?? t.category}</span>
                            : <span className="text-slate-400 dark:text-slate-500">—</span>
                          }
                        </td>
                        <td className="px-5 py-3 text-slate-500 dark:text-slate-400 truncate max-w-xs hidden md:table-cell">{t.subject ?? '—'}</td>
                        <td className="px-5 py-3 text-slate-400 dark:text-slate-500 hidden lg:table-cell">{fmtDate(t.created_at)}</td>
                        <td className="px-5 py-3">
                          <div className="flex gap-1 justify-end">
                            <Button variant="primary" size="sm" onClick={() => setSendTarget(t)}><Send size={13} /> Αποστολή</Button>
                            <Button variant="ghost" size="sm" onClick={() => handleCopyText(t)}><Copy size={13} /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDuplicate(t)}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                              </svg>
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { setEditing(t); setModalOpen(true) }}><Edit size={13} /></Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(t)} className="text-red-500 hover:text-red-700"><Trash2 size={13} /></Button>
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
            {preview.category && (
              <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                {EMAIL_TEMPLATE_CATEGORIES[preview.category] ?? preview.category}
              </span>
            )}
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
              <Button variant="ghost" onClick={() => { handleCopyText(preview); setPreview(null) }}><Copy size={14} /> Αντιγραφή</Button>
              <Button variant="primary" onClick={() => { setPreview(null); setSendTarget(preview) }}><Send size={14} /> Αποστολή</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Send modal — no context, manual recipient entry */}
      <EmailSendModal
        open={!!sendTarget}
        onClose={() => setSendTarget(null)}
        template={sendTarget}
      />

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
