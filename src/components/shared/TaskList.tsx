import { useState } from 'react'
import { Trash2, Plus } from 'lucide-react'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../../hooks/useTasks'
import { Button } from '../ui/Button'

export function TaskList({ entityType, entityId }: { entityType: string; entityId: string }) {
  const { data: tasks = [] } = useTasks(entityType, entityId)
  const createTask = useCreateTask(entityType, entityId)
  const updateTask = useUpdateTask(entityType, entityId)
  const deleteTask = useDeleteTask(entityType, entityId)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')

  async function handleAdd() {
    if (!title.trim()) return
    await createTask.mutateAsync({ title: title.trim(), due_date: dueDate || null })
    setTitle('')
    setDueDate('')
  }

  async function toggleDone(task: { id: string; status: 'open' | 'done' }) {
    await updateTask.mutateAsync({ id: task.id, values: { status: task.status === 'done' ? 'open' : 'done' } })
  }

  const now = new Date()

  function dueBadgeClass(due: string | null, status: string) {
    if (!due || status === 'done') return 'text-slate-400 dark:text-slate-500'
    const d = new Date(due)
    if (d < now) return 'text-red-600 dark:text-red-400 font-semibold'
    const diff = (d.getTime() - now.getTime()) / 86400000
    if (diff <= 3) return 'text-amber-600 dark:text-amber-400 font-semibold'
    return 'text-slate-400 dark:text-slate-500'
  }

  function fmtDue(due: string) {
    return new Date(due).toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
      <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Εργασίες / Follow-ups</h3>
      <div className="flex gap-2 mb-4">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Νέα εργασία…"
          className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
        />
        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          className="px-2 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
        />
        <Button variant="primary" size="sm" onClick={handleAdd} disabled={!title.trim() || createTask.isPending}>
          <Plus size={14} />
        </Button>
      </div>
      {tasks.length === 0
        ? <p className="text-sm text-slate-400 dark:text-slate-500">Δεν υπάρχουν εργασίες.</p>
        : <div className="space-y-2">
            {tasks.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <input
                  type="checkbox"
                  checked={t.status === 'done'}
                  onChange={() => toggleDone(t)}
                  className="w-4 h-4 rounded border-slate-300 accent-blue-600 shrink-0 cursor-pointer"
                />
                <p className={`flex-1 text-sm ${t.status === 'done' ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}>
                  {t.title}
                </p>
                {t.due_date && (
                  <span className={`text-xs shrink-0 ${dueBadgeClass(t.due_date, t.status)}`}>
                    {fmtDue(t.due_date)}
                  </span>
                )}
                <button onClick={() => deleteTask.mutate(t.id)} className="text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
      }
    </div>
  )
}
