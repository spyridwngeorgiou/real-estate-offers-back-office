import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const TABLES = ['properties', 'offers', 'contacts', 'notes', 'files', 'activities', 'counter_offers']

export function useRealtimeSync() {
  const qc = useQueryClient()

  useEffect(() => {
    const channels = TABLES.map(table =>
      supabase.channel(`rt_${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          qc.invalidateQueries({ queryKey: [table] })
          qc.invalidateQueries({ queryKey: [table.replace(/s$/, '')] })
        })
        .subscribe()
    )
    return () => { channels.forEach(c => supabase.removeChannel(c)) }
  }, [qc])
}
