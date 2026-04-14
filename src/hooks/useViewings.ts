import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Viewing } from '../types'

export function useViewings(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['viewings', propertyId],
    queryFn: async () => {
      if (!propertyId) return []
      const { data, error } = await supabase
        .from('viewings')
        .select('*, contact:contacts(full_name)')
        .eq('property_id', propertyId)
        .order('viewed_at', { ascending: false })
      if (error) throw error
      return data as Viewing[]
    },
    enabled: !!propertyId,
  })
}

export function useCreateViewing(propertyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: { contact_id: string; viewed_at: string; notes?: string | null }) => {
      const { data, error } = await supabase
        .from('viewings')
        .insert({ property_id: propertyId, ...values })
        .select('*, contact:contacts(full_name)').single()
      if (error) throw error
      return data as Viewing
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['viewings', propertyId] }),
  })
}

export function useDeleteViewing(propertyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('viewings').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['viewings', propertyId] }),
  })
}
