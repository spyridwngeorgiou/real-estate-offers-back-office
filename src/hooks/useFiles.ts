import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { uploadFile as storageUpload, deleteFile as storageDelete, getPublicUrl } from '../lib/storage'
import type { FileAttachment } from '../types'

export function useFiles(entityType: string, entityId: string | undefined) {
  return useQuery({
    queryKey: ['files', entityType, entityId],
    queryFn: async () => {
      if (!entityId) return []
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as FileAttachment[]
    },
    enabled: !!entityId,
  })
}

export function useUploadFile(entityType: string, entityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ file, label }: { file: File; label: string }) => {
      const { bucket_path } = await storageUpload(entityType, entityId, file, label)
      const { data, error } = await supabase.from('files').insert({
        entity_type: entityType,
        entity_id: entityId,
        bucket_path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        label,
      }).select().single()
      if (error) throw error
      return data as FileAttachment
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files', entityType, entityId] }),
  })
}

export function useDeleteFile(entityType: string, entityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, bucket_path }: { id: string; bucket_path: string }) => {
      await storageDelete(bucket_path)
      const { error } = await supabase.from('files').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files', entityType, entityId] }),
  })
}

export { getPublicUrl }
