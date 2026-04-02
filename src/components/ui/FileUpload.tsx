import { useState, useRef } from 'react'
import { Upload, Loader2, FileText, Image, Trash2, ExternalLink } from 'lucide-react'
import { useFiles, useUploadFile, useDeleteFile, getPublicUrl } from '../../hooks/useFiles'
import { FILE_LABELS } from '../../lib/utils'
import { useUIStore } from '../../store/uiStore'

interface FileUploadProps {
  entityType: string
  entityId: string
}

function formatBytes(b: number) {
  if (b < 1024) return b + ' B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB'
  return (b / 1024 / 1024).toFixed(1) + ' MB'
}

export function FileUpload({ entityType, entityId }: FileUploadProps) {
  const { data: files = [] } = useFiles(entityType, entityId)
  const uploadMutation = useUploadFile(entityType, entityId)
  const deleteMutation = useDeleteFile(entityType, entityId)
  const addToast = useUIStore(s => s.addToast)
  const [dragging, setDragging] = useState(false)
  const [label, setLabel] = useState(FILE_LABELS[0])
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return
    for (const file of Array.from(fileList)) {
      if (file.size > 100 * 1024 * 1024) { addToast('Μέγιστο μέγεθος: 100MB', 'error'); continue }
      await uploadMutation.mutateAsync({ file, label })
    }
    addToast('Αρχείο ανέβηκε επιτυχώς', 'success')
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <select value={label} onChange={e => setLabel(e.target.value)} className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white">
          {FILE_LABELS.map(l => <option key={l}>{l}</option>)}
        </select>
        <span className="text-xs text-slate-400">Επιλέξτε κατηγορία πριν ανεβάσετε</span>
      </div>

      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
      >
        {uploadMutation.isPending
          ? <Loader2 size={24} className="animate-spin mx-auto text-blue-500 mb-2" />
          : <Upload size={24} className="mx-auto text-slate-400 mb-2" />
        }
        <p className="text-sm text-slate-500">{uploadMutation.isPending ? 'Μεταφόρτωση…' : 'Σύρετε αρχεία ή κάντε κλικ'}</p>
        <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG, DOCX — αποθήκευση μέσω Cloudinary</p>
        <input ref={inputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" className="hidden" onChange={e => handleFiles(e.target.files)} />
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map(f => {
            const isImg = f.mime_type?.startsWith('image')
            const url = getPublicUrl(f.bucket_path)
            return (
              <div key={f.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                {isImg ? <Image size={18} className="text-blue-500 shrink-0" /> : <FileText size={18} className="text-red-500 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{f.label || f.file_name}</p>
                  <p className="text-xs text-slate-400">{f.file_name} {f.file_size ? `· ${formatBytes(f.file_size)}` : ''}</p>
                </div>
                <a href={url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-slate-200 rounded text-slate-500">
                  <ExternalLink size={15} />
                </a>
                <button
                  onClick={() => deleteMutation.mutate({ id: f.id, bucket_path: f.bucket_path })}
                  className="p-1.5 hover:bg-red-100 rounded text-slate-400 hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
