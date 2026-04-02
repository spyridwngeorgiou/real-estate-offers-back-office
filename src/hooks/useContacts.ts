import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { logActivity } from './useActivities'
import type { Contact } from '../types'

export function useContacts(filters?: { type?: string; search?: string }) {
  return useQuery({
    queryKey: ['contacts', filters],
    queryFn: async () => {
      let q = supabase.from('contacts').select('*').order('full_name')
      if (filters?.type) q = q.eq('contact_type', filters.type)
      if (filters?.search) q = q.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
      const { data, error } = await q
      if (error) throw error
      return data as Contact[]
    },
  })
}

export function useContact(id: string | undefined) {
  return useQuery({
    queryKey: ['contact', id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase.from('contacts').select('*').eq('id', id).single()
      if (error) throw error
      return data as Contact
    },
    enabled: !!id,
  })
}

export function useCreateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('contacts').insert(values).select().single()
      if (error) throw error
      return data as Contact
    },
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      logActivity('contact_added', `Επαφή προστέθηκε: ${c.full_name}`, 'contact', c.id)
    },
  })
}

export function useUpdateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<Contact> }) => {
      const { data, error } = await supabase.from('contacts').update(values).eq('id', id).select().single()
      if (error) throw error
      return data as Contact
    },
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      qc.invalidateQueries({ queryKey: ['contact', c.id] })
    },
  })
}

export function useDeleteContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contacts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  })
}
