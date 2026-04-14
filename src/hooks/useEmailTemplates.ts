import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { EmailTemplate } from '../types'

export function useEmailTemplates() {
  return useQuery({
    queryKey: ['email_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('name')
      if (error) throw error
      return data as EmailTemplate[]
    },
  })
}

export function useCreateEmailTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: Omit<EmailTemplate, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('email_templates')
        .insert(values)
        .select().single()
      if (error) throw error
      return data as EmailTemplate
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email_templates'] }),
  })
}

export function useUpdateEmailTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<EmailTemplate> }) => {
      const { data, error } = await supabase
        .from('email_templates')
        .update(values)
        .eq('id', id)
        .select().single()
      if (error) throw error
      return data as EmailTemplate
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email_templates'] }),
  })
}

export function useDeleteEmailTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('email_templates').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email_templates'] }),
  })
}
