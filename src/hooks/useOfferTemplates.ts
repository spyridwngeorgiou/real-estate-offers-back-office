import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { OfferTemplate } from '../types'

export function useOfferTemplates() {
  return useQuery({
    queryKey: ['offer_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offer_templates')
        .select('*')
        .order('name')
      if (error) throw error
      return data as OfferTemplate[]
    },
  })
}

export function useCreateOfferTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: Omit<OfferTemplate, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('offer_templates')
        .insert(values)
        .select().single()
      if (error) throw error
      return data as OfferTemplate
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offer_templates'] }),
  })
}

export function useUpdateOfferTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<OfferTemplate> }) => {
      const { data, error } = await supabase
        .from('offer_templates')
        .update(values)
        .eq('id', id)
        .select().single()
      if (error) throw error
      return data as OfferTemplate
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offer_templates'] }),
  })
}

export function useDeleteOfferTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('offer_templates').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offer_templates'] }),
  })
}
