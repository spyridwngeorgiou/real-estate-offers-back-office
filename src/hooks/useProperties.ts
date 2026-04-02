import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { logActivity } from './useActivities'
import type { Property } from '../types'

export function useProperties(filters?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: ['properties', filters],
    queryFn: async () => {
      let q = supabase.from('properties').select('*').order('created_at', { ascending: false })
      if (filters?.status) q = q.eq('status', filters.status)
      if (filters?.search) q = q.or(`address.ilike.%${filters.search}%,city.ilike.%${filters.search}%,neighborhood.ilike.%${filters.search}%`)
      const { data, error } = await q
      if (error) throw error
      return data as Property[]
    },
  })
}

export function useProperty(id: string | undefined) {
  return useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase.from('properties').select('*').eq('id', id).single()
      if (error) throw error
      return data as Property
    },
    enabled: !!id,
  })
}

export function useCreateProperty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: Omit<Property, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('properties').insert(values).select().single()
      if (error) throw error
      return data as Property
    },
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ['properties'] })
      logActivity('property_added', `Ακίνητο προστέθηκε: ${p.address}`, 'property', p.id)
    },
  })
}

export function useUpdateProperty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<Property> }) => {
      const { data, error } = await supabase.from('properties').update(values).eq('id', id).select().single()
      if (error) throw error
      return data as Property
    },
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ['properties'] })
      qc.invalidateQueries({ queryKey: ['property', p.id] })
      logActivity('property_updated', `Ακίνητο ενημερώθηκε: ${p.address}`, 'property', p.id)
    },
  })
}

export function useDeleteProperty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('properties').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['properties'] }),
  })
}
