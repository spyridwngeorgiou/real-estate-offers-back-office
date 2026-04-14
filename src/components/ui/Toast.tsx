import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'
import { useUIStore } from '../../store/uiStore'

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore()
  if (!toasts.length) return null

  const ICONS = { success: CheckCircle, error: AlertCircle, info: Info }
  const COLORS = {
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/40 dark:border-green-700 dark:text-green-300',
    error:   'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/40 dark:border-red-700 dark:text-red-300',
    info:    'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-300',
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map(t => {
        const Icon = ICONS[t.type]
        return (
          <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg text-sm font-medium ${COLORS[t.type]}`}>
            <Icon size={16} />
            <span>{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="ml-2 opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
