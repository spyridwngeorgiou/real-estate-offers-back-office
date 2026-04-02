import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Activity } from '../types'

export function useActivities(limit = 20) {
  return useQuery({
    queryKey: ['activities', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as Activity[]
    },
  })
}

export async function logActivity(
  event_type: string,
  description: string,
  entity_type?: string,
  entity_id?: string,
) {
  await supabase.from('activities').insert({ event_type, description, entity_type, entity_id })
}
