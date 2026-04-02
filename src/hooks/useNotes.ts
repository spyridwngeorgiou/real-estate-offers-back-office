import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Note } from '../types'

export function useNotes(entityType: string, entityId: string | undefined) {
  return useQuery({
    queryKey: ['notes', entityType, entityId],
    queryFn: async () => {
      if (!entityId) return []
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Note[]
    },
    enabled: !!entityId,
  })
}

export function useCreateNote(entityType: string, entityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (text: string) => {
      const { data, error } = await supabase
        .from('notes')
        .insert({ entity_type: entityType, entity_id: entityId, text })
        .select().single()
      if (error) throw error
      return data as Note
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes', entityType, entityId] }),
  })
}

export function useDeleteNote(entityType: string, entityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes', entityType, entityId] }),
  })
}
