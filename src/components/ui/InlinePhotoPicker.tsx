import { useRef, useState } from 'react'
import { Paperclip, X, FileText, FileSpreadsheet, File } from 'lucide-react'

interface Props {
  onChange: (files: File[]) => void
}

function FilePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isImage = file.type.startsWith('image/')
  const url = isImage ? URL.createObjectURL(file) : null

  const Icon = file.type === 'application/pdf' ? FileText
    : file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls') ? FileSpreadsheet
    : File

  return (
    <div className="relative group">
      {isImage && url ? (
        <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg border border-slate-200" />
      ) : (
        <div className="w-20 h-20 rounded-lg border border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-1 px-1">
          <Icon size={22} className="text-slate-400 shrink-0" />
          <span className="text-[10px] text-slate-400 truncate w-full text-center leading-tight">
            {file.name.length > 12 ? file.name.slice(0, 10) + '…' : file.name}
          </span>
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={10} />
      </button>
    </div>
  )
}

export function InlinePhotoPicker({ onChange }: Props) {
  const [files, setFiles] = useState<File[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  function addFiles(fileList: FileList | null) {
    if (!fileList) return
    const updated = [...files, ...Array.from(fileList)]
    setFiles(updated)
    onChange(updated)
  }

  function remove(index: number) {
    const updated = files.filter((_, i) => i !== index)
    setFiles(updated)
    onChange(updated)
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {files.map((f, i) => (
          <FilePreview key={i} file={f} onRemove={() => remove(i)} />
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
        >
          <Paperclip size={20} />
          <span className="text-xs mt-1">Αρχείο</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={e => addFiles(e.target.files)}
      />
    </div>
  )
}
