import { useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'

interface Props {
  onChange: (files: File[]) => void
}

export function InlinePhotoPicker({ onChange }: Props) {
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  function addFiles(fileList: FileList | null) {
    if (!fileList) return
    const newEntries = Array.from(fileList).map(file => ({
      file,
      url: URL.createObjectURL(file),
    }))
    const updated = [...previews, ...newEntries]
    setPreviews(updated)
    onChange(updated.map(e => e.file))
  }

  function remove(index: number) {
    const updated = previews.filter((_, i) => i !== index)
    setPreviews(updated)
    onChange(updated.map(e => e.file))
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {previews.map((p, i) => (
          <div key={i} className="relative group">
            <img src={p.url} alt="" className="w-20 h-20 object-cover rounded-lg border border-slate-200" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
        >
          <ImagePlus size={20} />
          <span className="text-xs mt-1">Φωτό</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={e => addFiles(e.target.files)}
      />
    </div>
  )
}
