import { useState, useRef } from 'react'
import { Upload, Loader2, FileText, Trash2, ExternalLink, X, ChevronLeft, ChevronRight } from 'lucide-react'
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
  const [lightbox, setLightbox] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const images = files.filter(f => f.mime_type?.startsWith('image'))
  const docs = files.filter(f => !f.mime_type?.startsWith('image'))

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return
    for (const file of Array.from(fileList)) {
      if (file.size > 100 * 1024 * 1024) { addToast('Μέγιστο μέγεθος: 100MB', 'error'); continue }
      await uploadMutation.mutateAsync({ file, label })
    }
    addToast('Αρχείο ανέβηκε', 'success')
  }

  function prevImg() { setLightbox(i => i !== null ? (i - 1 + images.length) % images.length : null) }
  function nextImg() { setLightbox(i => i !== null ? (i + 1) % images.length : null) }

  return (
    <div>
      {/* Upload area */}
      <div className="mb-3 flex items-center gap-3">
        <select value={label} onChange={e => setLabel(e.target.value)}
          className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white">
          {FILE_LABELS.map(l => <option key={l}>{l}</option>)}
        </select>
        <span className="text-xs text-slate-400">Επιλέξτε τύπο πριν ανεβάσετε</span>
      </div>

      <div
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors
          ${dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
      >
        {uploadMutation.isPending
          ? <Loader2 size={22} className="animate-spin mx-auto text-blue-500 mb-2" />
          : <Upload size={22} className="mx-auto text-slate-400 mb-2" />
        }
        <p className="text-sm text-slate-500">{uploadMutation.isPending ? 'Μεταφόρτωση…' : 'Σύρετε ή κάντε κλικ για ανέβασμα'}</p>
        <p className="text-xs text-slate-400 mt-0.5">PDF, εικόνες, έγγραφα και άλλα (έως 100MB)</p>
        <input ref={inputRef} type="file" multiple
          className="hidden" onChange={e => handleFiles(e.target.files)} />
      </div>

      {/* Photo gallery */}
      {images.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-slate-500 uppercase mb-2">Φωτογραφίες ({images.length})</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {images.map((f, idx) => (
              <div key={f.id} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-100 cursor-pointer"
                onClick={() => setLightbox(idx)}>
                <img src={getPublicUrl(f.bucket_path)} alt={f.label ?? f.file_name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <button
                  onClick={e => { e.stopPropagation(); deleteMutation.mutate({ id: f.id, bucket_path: f.bucket_path }) }}
                  className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Docs list */}
      {docs.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-slate-500 uppercase mb-2">Έγγραφα ({docs.length})</p>
          <div className="space-y-2">
            {docs.map(f => (
              <div key={f.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <FileText size={16} className="text-red-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{f.label || f.file_name}</p>
                  <p className="text-xs text-slate-400">{f.file_name}{f.file_size ? ` · ${formatBytes(f.file_size)}` : ''}</p>
                </div>
                <a href={getPublicUrl(f.bucket_path)} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-500 shrink-0">
                  <ExternalLink size={14} />
                </a>
                <button onClick={() => deleteMutation.mutate({ id: f.id, bucket_path: f.bucket_path })}
                  className="p-1.5 hover:bg-red-100 rounded text-slate-400 hover:text-red-600 shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(null)}>
          <button onClick={e => { e.stopPropagation(); prevImg() }}
            className="absolute left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
            <ChevronLeft size={24} />
          </button>
          <img
            src={getPublicUrl(images[lightbox].bucket_path)}
            alt={images[lightbox].label ?? images[lightbox].file_name}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <button onClick={e => { e.stopPropagation(); nextImg() }}
            className="absolute right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
            <ChevronRight size={24} />
          </button>
          <button onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
            <X size={20} />
          </button>
          {images.length > 1 && (
            <div className="absolute bottom-4 text-white/60 text-sm">
              {lightbox + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
