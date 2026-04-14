import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Commission } from '../types'

export function useCommissions(offerId: string | undefined) {
  return useQuery({
    queryKey: ['commissions', offerId],
    queryFn: async () => {
      if (!offerId) return []
      const { data, error } = await supabase
        .from('commissions')
        .select('*, agent:contacts(full_name)')
        .eq('offer_id', offerId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as Commission[]
    },
    enabled: !!offerId,
  })
}

export function useCreateCommission(offerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: Omit<Commission, 'id' | 'created_at' | 'agent'>) => {
      const { data, error } = await supabase
        .from('commissions')
        .insert(values)
        .select('*, agent:contacts(full_name)').single()
      if (error) throw error
      return data as Commission
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commissions', offerId] }),
  })
}

export function useUpdateCommission(offerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<Commission> }) => {
      const { data, error } = await supabase
        .from('commissions')
        .update(values)
        .eq('id', id)
        .select('*, agent:contacts(full_name)').single()
      if (error) throw error
      return data as Commission
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commissions', offerId] }),
  })
}

export function useDeleteCommission(offerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('commissions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commissions', offerId] }),
  })
}
