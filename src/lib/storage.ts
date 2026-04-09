const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string

function resourceType(file: File): 'image' | 'video' | 'raw' {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  return 'raw'
}

export async function uploadFile(
  entityType: string,
  entityId: string,
  file: File,
  _label: string,
): Promise<{ bucket_path: string; public_url: string }> {
  const type = resourceType(file)
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', `re-greece/${entityType}/${entityId}`)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${type}/upload`,
    { method: 'POST', body: formData },
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? 'Upload failed')
  }

  const data = await res.json()
  return { bucket_path: data.secure_url, public_url: data.secure_url }
}

export function getPublicUrl(bucket_path: string): string {
  return bucket_path
}

export async function deleteFile(_bucket_path: string): Promise<void> {
  // Signed deletion requires API secret — manage via Cloudinary dashboard
}
