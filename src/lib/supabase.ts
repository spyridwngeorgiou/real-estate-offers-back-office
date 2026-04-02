import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string || 'https://trfblvmmrrijwdqtdlyx.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyZmJsdm1tcnJpandkcXRkbHl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjEwMTcsImV4cCI6MjA5MDYzNzAxN30.6rs2x6bLzzai8q1o0jjgnf12jfxMr0sDor8qa0ek5Sk'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
