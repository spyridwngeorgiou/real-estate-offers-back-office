import { useState, useEffect } from 'react'
import { Send, ChevronDown, ChevronUp } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { inputClass, selectClass } from '../ui/FormField'
import { useEmailTemplates } from '../../hooks/useEmailTemplates'
import { useContacts } from '../../hooks/useContacts'
import { useUIStore } from '../../store/uiStore'
import { EMAIL_TEMPLATE_CATEGORIES, substituteVars } from '../../lib/templateUtils'
import type { EmailTemplate } from '../../types'

interface EmailSendModalProps {
  open: boolean
  onClose: () => void
  // Pre-selected template (e.g. from templates list). If null, user picks from dropdown.
  template?: EmailTemplate | null
  // Pre-filled recipient
  recipientEmail?: string
  recipientName?: string
  // Variable values to substitute into the template
  vars?: Record<string, string>
  // Optional: filter templates shown in picker to this category
  suggestedCategory?: string
}

export function EmailSendModal({
  open, onClose, template: initialTemplate,
  recipientEmail = '', recipientName = '',
  vars = {}, suggestedCategory,
}: EmailSendModalProps) {
  const { data: templates = [] } = useEmailTemplates()
  const { data: contacts = [] } = useContacts()
  const addToast = useUIStore(s => s.addToast)

  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [toEmail, setToEmail] = useState(recipientEmail)
  const [manualEmails, setManualEmails] = useState('')
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([])
  const [contactSearch, setContactSearch] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState(suggestedCategory ?? '')

  // Sync recipient when props change (e.g. modal reopened with different offer)
  useEffect(() => { if (open) { setToEmail(recipientEmail); setSelectedContactIds([]); setManualEmails('') } }, [open, recipientEmail])
  useEffect(() => { if (open && initialTemplate) setSelectedTemplateId(initialTemplate.id) }, [open, initialTemplate])
  useEffect(() => { if (open) setCategoryFilter(suggestedCategory ?? '') }, [open, suggestedCategory])

  const activeTemplate = initialTemplate ?? templates.find(t => t.id === selectedTemplateId) ?? null

  const resolvedSubject = activeTemplate ? substituteVars(activeTemplate.subject ?? '', vars) : ''
  const resolvedBody    = activeTemplate ? substituteVars(activeTemplate.body, vars) : ''

  const filteredTemplates = categoryFilter
    ? templates.filter(t => t.category === categoryFilter)
    : templates

  const filteredContacts = contactSearch
    ? contacts.filter(c => c.full_name.toLowerCase().includes(contactSearch.toLowerCase()) || c.email?.toLowerCase().includes(contactSearch.toLowerCase()))
    : contacts

  function toggleContact(id: string) {
    setSelectedContactIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function collectRecipients(): string[] {
    const fromContact = contacts.filter(c => selectedContactIds.includes(c.id) && c.email).map(c => c.email!)
    const fromManual = manualEmails.split(/[,;\s]+/).map(e => e.trim()).filter(e => e.includes('@'))
    const fromTo = toEmail.split(/[,;\s]+/).map(e => e.trim()).filter(e => e.includes('@'))
    return [...new Set([...fromTo, ...fromContact, ...fromManual])]
  }

  function handleSend() {
    if (!activeTemplate) { addToast('Επιλέξτε πρότυπο', 'error'); return }
    const recipients = collectRecipients()
    if (recipients.length === 0) { addToast('Προσθέστε τουλάχιστον έναν παραλήπτη', 'error'); return }
    const mailto = `mailto:${recipients.join(',')}?subject=${encodeURIComponent(resolvedSubject)}&body=${encodeURIComponent(resolvedBody)}`
    window.location.href = mailto
    addToast('Άνοιγμα email…', 'success')
    onClose()
  }

  const recipientCount = collectRecipients().length

  return (
    <Modal open={open} onClose={onClose} title="Αποστολή Email" size="lg">
      <div className="space-y-5">

        {/* Template picker — only shown when no template pre-selected */}
        {!initialTemplate && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5 mb-2">
              <button onClick={() => setCategoryFilter('')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${!categoryFilter ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}>
                Όλα
              </button>
              {Object.entries(EMAIL_TEMPLATE_CATEGORIES).map(([v, l]) => (
                <button key={v} onClick={() => setCategoryFilter(v)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${categoryFilter === v ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}>
                  {l}
                </button>
              ))}
            </div>
            <select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} className={selectClass}>
              <option value="">— Επιλέξτε πρότυπο —</option>
              {filteredTemplates.map(t => (
                <option key={t.id} value={t.id}>{t.name}{t.category ? ` (${EMAIL_TEMPLATE_CATEGORIES[t.category] ?? t.category})` : ''}</option>
              ))}
            </select>
          </div>
        )}

        {/* Selected template info */}
        {activeTemplate && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">{activeTemplate.name}</p>
                {resolvedSubject && <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">Θέμα: {resolvedSubject}</p>}
              </div>
              <button onClick={() => setShowPreview(v => !v)}
                className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline">
                {showPreview ? <><ChevronUp size={12} /> Κρύψιμο</> : <><ChevronDown size={12} /> Προεπισκόπηση</>}
              </button>
            </div>
            {showPreview && (
              <pre className="mt-3 text-xs text-blue-800 dark:text-blue-200 whitespace-pre-wrap font-sans bg-blue-100/50 dark:bg-blue-900/30 p-3 rounded-lg max-h-40 overflow-y-auto">
                {resolvedBody}
              </pre>
            )}
          </div>
        )}

        {/* Primary recipient (pre-filled from context) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Παραλήπτης{recipientName ? ` — ${recipientName}` : ''}
          </label>
          <input
            type="email"
            value={toEmail}
            onChange={e => setToEmail(e.target.value)}
            placeholder="email@example.com"
            className={inputClass}
          />
        </div>

        {/* Additional recipients from contacts */}
        <details className="group">
          <summary className="cursor-pointer text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 list-none flex items-center gap-1">
            <ChevronDown size={13} className="group-open:rotate-180 transition-transform" />
            Προσθήκη επιπλέον παραληπτών
          </summary>
          <div className="mt-3 space-y-3">
            <input
              type="text"
              value={contactSearch}
              onChange={e => setContactSearch(e.target.value)}
              placeholder="Αναζήτηση επαφής…"
              className={inputClass}
            />
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-48 overflow-y-auto">
              {filteredContacts.map(c => (
                <label key={c.id}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-50 dark:border-slate-700/50 last:border-0 cursor-pointer">
                  <input type="checkbox" checked={selectedContactIds.includes(c.id)}
                    onChange={() => toggleContact(c.id)}
                    className="rounded border-slate-300 w-3.5 h-3.5 accent-blue-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 dark:text-slate-100 truncate">{c.full_name}</p>
                    {c.email
                      ? <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{c.email}</p>
                      : <p className="text-xs text-red-400">Χωρίς email</p>
                    }
                  </div>
                </label>
              ))}
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">ή χειροκίνητα (comma-separated)</p>
              <input value={manualEmails} onChange={e => setManualEmails(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
                className={inputClass} />
            </div>
          </div>
        </details>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
          <Button variant="secondary" onClick={onClose}>Ακύρωση</Button>
          <Button variant="primary" onClick={handleSend} disabled={!activeTemplate || recipientCount === 0}>
            <Send size={14} />
            {recipientCount > 0 ? `Άνοιγμα email (${recipientCount})` : 'Άνοιγμα email'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
