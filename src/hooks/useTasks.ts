import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Task } from '../types'

export function useTasks(entityType: string, entityId: string | undefined) {
  return useQuery({
    queryKey: ['tasks', entityType, entityId],
    queryFn: async () => {
      if (!entityId) return []
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('due_date', { ascending: true, nullsFirst: false })
      if (error) throw error
      return data as Task[]
    },
    enabled: !!entityId,
  })
}

export function useCreateTask(entityType: string, entityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: { title: string; due_date?: string | null }) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ entity_type: entityType, entity_id: entityId, ...values })
        .select().single()
      if (error) throw error
      return data as Task
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', entityType, entityId] }),
  })
}

export function useUpdateTask(entityType: string, entityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<Task> }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(values)
        .eq('id', id)
        .select().single()
      if (error) throw error
      return data as Task
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', entityType, entityId] }),
  })
}

export function useDeleteTask(entityType: string, entityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', entityType, entityId] }),
  })
}
