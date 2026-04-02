import { supabase } from './supabase'

const BUCKET = 'attachments'

export async function uploadFile(
  entityType: string,
  entityId: string,
  file: File,
  label: string,
): Promise<{ bucket_path: string; public_url: string }> {
  const path = `${entityType}/${entityId}/${Date.now()}_${file.name}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { bucket_path: path, public_url: data.publicUrl }
}

export function getPublicUrl(bucket_path: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(bucket_path)
  return data.publicUrl
}

export async function deleteFile(bucket_path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([bucket_path])
  if (error) throw error
}
