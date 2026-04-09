const PUBLIC_KEY = import.meta.env.VITE_UPLOADCARE_PUBLIC_KEY as string

export async function uploadFile(
  _entityType: string,
  _entityId: string,
  file: File,
  _label: string,
): Promise<{ bucket_path: string; public_url: string }> {
  const formData = new FormData()
  formData.append('UPLOADCARE_PUB_KEY', PUBLIC_KEY)
  formData.append('UPLOADCARE_STORE', '1')
  formData.append('file', file)

  const res = await fetch('https://upload.uploadcare.com/base/', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.detail ?? 'Upload failed')
  }

  const data = await res.json()
  const url = `https://ucarecdn.com/${data.file}/`
  return { bucket_path: url, public_url: url }
}

export function getPublicUrl(bucket_path: string): string {
  return bucket_path
}

export async function deleteFile(_bucket_path: string): Promise<void> {
  // Deletion requires secret key — manage via Uploadcare dashboard
}
