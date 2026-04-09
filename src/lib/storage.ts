// File storage via Cloudinary — 25GB free, no per-file size limits
// Uses unsigned uploads (no secret exposed). Files are public URLs.
// Deletion removes the record from DB; to purge from Cloudinary use their dashboard.

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string

export async function uploadFile(
  entityType: string,
  entityId: string,
  file: File,
  _label: string,
): Promise<{ bucket_path: string; public_url: string }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', `re-greece/${entityType}/${entityId}`)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    { method: 'POST', body: formData },
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? 'Cloudinary upload failed')
  }

  const data = await res.json()
  // Store the full secure URL as bucket_path — getPublicUrl returns it as-is
  return { bucket_path: data.secure_url, public_url: data.secure_url }
}

// bucket_path IS the Cloudinary secure URL — just return it
export function getPublicUrl(bucket_path: string): string {
  return bucket_path
}

// Removes record from DB. File stays on Cloudinary (manage via dashboard).
export async function deleteFile(_bucket_path: string): Promise<void> {
  // No-op: signed deletion requires API secret (not safe in frontend)
}
