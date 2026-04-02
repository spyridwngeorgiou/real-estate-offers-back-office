import { useState } from 'react'
import { Trash2, Plus } from 'lucide-react'
import { useNotes, useCreateNote, useDeleteNote } from '../../hooks/useNotes'
import { fmtDate } from '../../lib/utils'
import { Button } from '../ui/Button'

export function NotesList({ entityType, entityId }: { entityType: string; entityId: string }) {
  const { data: notes = [] } = useNotes(entityType, entityId)
  const createNote = useCreateNote(entityType, entityId)
  const deleteNote = useDeleteNote(entityType, entityId)
  const [text, setText] = useState('')

  async function handleAdd() {
    if (!text.trim()) return
    await createNote.mutateAsync(text.trim())
    setText('')
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h3 className="font-semibold text-slate-900 mb-4">Σημειώσεις</h3>
      <div className="flex gap-2 mb-4">
        <textarea value={text} onChange={e => setText(e.target.value)} rows={2} placeholder="Προσθήκη σημείωσης…"
          className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        <Button variant="primary" size="sm" onClick={handleAdd} disabled={!text.trim() || createNote.isPending}>
          <Plus size={14} />
        </Button>
      </div>
      {notes.length === 0
        ? <p className="text-sm text-slate-400">Καμία σημείωση.</p>
        : <div className="space-y-2">
            {notes.map(n => (
              <div key={n.id} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                <p className="flex-1 text-sm text-slate-700">{n.text}</p>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs text-slate-400">{fmtDate(n.created_at)}</span>
                  <button onClick={() => deleteNote.mutate(n.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  )
}
