import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Users, Mail, Phone, ArrowUp, ArrowDown } from 'lucide-react'
import { Topbar } from '../components/layout/Topbar'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { ContactForm } from '../components/contacts/ContactForm'
import { useContacts, useCreateContact } from '../hooks/useContacts'
import { CONTACT_TYPE_LABELS } from '../lib/utils'
import { useUIStore } from '../store/uiStore'
import { uploadFile } from '../lib/storage'
import { supabase } from '../lib/supabase'

const TYPE_OPTIONS = [
  { value: '', label: 'Όλοι οι τύποι' },
  { value: 'buyer', label: 'Αγοραστές' },
  { value: 'seller', label: 'Πωλητές' },
  { value: 'agent', label: 'Μεσίτες' },
  { value: 'notary', label: 'Συμβολαιογράφοι' },
  { value: 'lawyer', label: 'Δικηγόροι' },
  { value: 'supplier', label: 'Προμηθευτές' },
  { value: 'contractor', label: 'Ανάδοχοι / Τεχνίτες' },
  { value: 'other', label: 'Άλλοι' },
]

export function Contacts() {
  const navigate = useNavigate()
  const addToast = useUIStore(s => s.addToast)
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([])
  const [sortCol, setSortCol] = useState('full_name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  function toggleSort(col: string) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const { data: rawContacts = [], isLoading } = useContacts({ type: typeFilter || undefined, search })
  const contacts = [...rawContacts].sort((a, b) => {
    const av = (a as any)[sortCol] ?? ''
    const bv = (b as any)[sortCol] ?? ''
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })
  const createContact = useCreateContact()

  async function handleCreate(values: any) {
    const contact = await createContact.mutateAsync(values)
    for (const file of pendingPhotos) {
      try {
        const { bucket_path } = await uploadFile('contact', contact.id, file, 'Φωτογραφία')
        await supabase.from('files').insert({ entity_type: 'contact', entity_id: contact.id, bucket_path, file_name: file.name, file_size: file.size, mime_type: file.type, label: 'Φωτογραφία' })
      } catch { /* skip */ }
    }
    setPendingPhotos([])
    addToast('Επαφή προστέθηκε', 'success')
    setModalOpen(false)
  }

  return (
    <div>
      <Topbar title="Επαφές" actions={
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Νέα Επαφή
        </Button>
      } />

      <div className="p-4 lg:p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Αναζήτηση επαφής…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {isLoading
          ? <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">Φόρτωση…</div>
          : contacts.length === 0
            ? <EmptyState icon={<Users size={48} />} title="Δεν βρέθηκαν επαφές"
                description="Προσθέστε αγοραστές, πωλητές, μεσίτες και συμβολαιογράφους."
                action={<Button variant="primary" onClick={() => setModalOpen(true)}><Plus size={16} /> Νέα Επαφή</Button>} />
            : <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      {[
                        { col: 'full_name', label: 'Όνομα' },
                        { col: 'contact_type', label: 'Τύπος' },
                        { col: 'company', label: 'Εταιρεία' },
                        { col: 'email', label: 'Email' },
                        { col: null, label: 'Τηλέφωνο' },
                      ].map(({ col, label }) => (
                        <th key={label}
                          className={`px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase ${col ? 'cursor-pointer hover:text-slate-800 select-none' : ''}`}
                          onClick={() => col && toggleSort(col)}>
                          <span className="inline-flex items-center gap-1">
                            {label}
                            {col && sortCol === col && (sortDir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                          </span>
                        </th>
                      ))}
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map(c => (
                      <tr key={c.id} onClick={() => navigate(`/contacts/${c.id}`)}
                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                        <td className="px-5 py-3 font-semibold text-slate-900">{c.full_name}</td>
                        <td className="px-5 py-3">
                          <Badge label={CONTACT_TYPE_LABELS[c.contact_type] ?? c.contact_type} variant={c.contact_type} />
                        </td>
                        <td className="px-5 py-3 text-slate-500">{c.company ?? '—'}</td>
                        <td className="px-5 py-3">
                          {c.email
                            ? <a href={`mailto:${c.email}`} onClick={e => e.stopPropagation()}
                                className="flex items-center gap-1 text-blue-600 hover:underline">
                                <Mail size={13} />{c.email}
                              </a>
                            : <span className="text-slate-400">—</span>
                          }
                        </td>
                        <td className="px-5 py-3">
                          {c.phone || c.mobile
                            ? <span className="flex items-center gap-1 text-slate-700">
                                <Phone size={13} />{c.mobile ?? c.phone}
                              </span>
                            : <span className="text-slate-400">—</span>
                          }
                        </td>
                        <td className="px-5 py-3">
                          <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); navigate(`/contacts/${c.id}`) }}>
                            Άνοιγμα →
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
        }
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Νέα Επαφή" size="md">
        <ContactForm onSubmit={handleCreate} onCancel={() => setModalOpen(false)} loading={createContact.isPending} onPhotosChange={setPendingPhotos} />
      </Modal>
    </div>
  )
}
