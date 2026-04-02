import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  dirty?: boolean
}

const SIZES = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

export function Modal({ open, onClose, title, children, size = 'md', dirty }: ModalProps) {
  function handleClose() {
    if (dirty && !window.confirm('Έχετε αλλαγές που δεν αποθηκεύτηκαν. Να κλείσει το παράθυρο;')) return
    onClose()
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [dirty, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className={`relative bg-white w-full ${SIZES[size]} flex flex-col
        rounded-t-2xl sm:rounded-xl shadow-2xl
        max-h-[92dvh] sm:max-h-[90vh]`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {dirty && <span className="w-2 h-2 rounded-full bg-amber-400" title="Αναποθήκευτες αλλαγές" />}
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
