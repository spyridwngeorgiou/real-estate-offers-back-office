import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { logActivity } from './useActivities'
import type { Offer, CounterOffer } from '../types'

export function useOffers(filters?: { status?: string; property_id?: string; search?: string }) {
  return useQuery({
    queryKey: ['offers', filters],
    queryFn: async () => {
      let q = supabase.from('offers').select(`
        *,
        property:properties(id, address, city, list_price),
        buyer:contacts!offers_buyer_id_fkey(id, full_name),
        contractor:contacts!offers_contractor_id_fkey(id, full_name),
        buyer_agent:contacts!offers_buyer_agent_id_fkey(id, full_name),
        seller_agent:contacts!offers_seller_agent_id_fkey(id, full_name),
        notary:contacts!offers_notary_id_fkey(id, full_name),
        files:files!files_entity_id_fkey(id, file_name, bucket_path)
      `).order('created_at', { ascending: false })
      if (filters?.status) q = q.eq('status', filters.status)
      if (filters?.property_id) q = q.eq('property_id', filters.property_id)
      const { data, error } = await q
      if (error) throw error
      return data as any[]
    },
  })
}

export function useOffer(id: string | undefined) {
  return useQuery({
    queryKey: ['offer', id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase.from('offers').select(`
        *,
        property:properties(id, address, city, list_price, sqm),
        buyer:contacts!offers_buyer_id_fkey(id, full_name, phone, email),
        contractor:contacts!offers_contractor_id_fkey(id, full_name, phone, email),
        buyer_agent:contacts!offers_buyer_agent_id_fkey(id, full_name, phone),
        seller_agent:contacts!offers_seller_agent_id_fkey(id, full_name, phone),
        notary:contacts!offers_notary_id_fkey(id, full_name, phone),
        counter_offers(*)
      `).eq('id', id).single()
      if (error) throw error
      return data as any
    },
    enabled: !!id,
  })
}

export function useCreateOffer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: Omit<Offer, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('offers').insert(values).select().single()
      if (error) throw error
      return data as Offer
    },
    onSuccess: (o) => {
      qc.invalidateQueries({ queryKey: ['offers'] })
      logActivity('offer_added', `Προσφορά €${o.offer_price.toLocaleString('el-GR')} καταχωρήθηκε`, 'offer', o.id)
    },
  })
}

export function useUpdateOffer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<Offer> }) => {
      const { data, error } = await supabase.from('offers').update(values).eq('id', id).select().single()
      if (error) throw error
      return data as Offer
    },
    onSuccess: (o) => {
      qc.invalidateQueries({ queryKey: ['offers'] })
      qc.invalidateQueries({ queryKey: ['offer', o.id] })
    },
  })
}

export function useDeleteOffer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('offers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offers'] }),
  })
}

export function useCreateCounterOffer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: Omit<CounterOffer, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('counter_offers').insert(values).select().single()
      if (error) throw error
      await supabase.from('offers').update({ status: 'countered' }).eq('id', values.offer_id)
      return data as CounterOffer
    },
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ['offers'] })
      qc.invalidateQueries({ queryKey: ['offer', c.offer_id] })
      logActivity('status_changed', `Αντιπροσφορά καταχωρήθηκε`, 'offer', c.offer_id)
    },
  })
}
