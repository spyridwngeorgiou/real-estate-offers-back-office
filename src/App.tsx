import { lazy, Suspense, useState, useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from './components/layout/Layout'
import { useRealtimeSync } from './hooks/useRealtimeSync'
import { supabase } from './lib/supabase'
import { Login } from './pages/Login'

const Dashboard    = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })))
const Properties   = lazy(() => import('./pages/Properties').then(m => ({ default: m.Properties })))
const PropertyDetail = lazy(() => import('./pages/PropertyDetail').then(m => ({ default: m.PropertyDetail })))
const Offers       = lazy(() => import('./pages/Offers').then(m => ({ default: m.Offers })))
const OfferDetail  = lazy(() => import('./pages/OfferDetail').then(m => ({ default: m.OfferDetail })))
const Contacts     = lazy(() => import('./pages/Contacts').then(m => ({ default: m.Contacts })))
const ContactDetail = lazy(() => import('./pages/ContactDetail').then(m => ({ default: m.ContactDetail })))
const Analytics    = lazy(() => import('./pages/Analytics').then(m => ({ default: m.Analytics })))
const Welcome      = lazy(() => import('./pages/Welcome').then(m => ({ default: m.Welcome })))
const EmailTemplates = lazy(() => import('./pages/EmailTemplates').then(m => ({ default: m.EmailTemplates })))
const OfferTemplates = lazy(() => import('./pages/OfferTemplates').then(m => ({ default: m.OfferTemplates })))
const Calculator     = lazy(() => import('./pages/Calculator').then(m => ({ default: m.Calculator })))

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } }
})

function AppInner() {
  useRealtimeSync()
  const [session, setSession] = useState<any>(undefined) // undefined = checking, null = logged out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-400 text-sm">
        Φόρτωση…
      </div>
    )
  }

  if (!session) return <Login />

  return (
    <Layout>
      <Suspense fallback={<div className="flex items-center justify-center h-full text-slate-400 text-sm">Φόρτωση…</div>}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/offers/:id" element={<OfferDetail />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/contacts/:id" element={<ContactDetail />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/email-templates" element={<EmailTemplates />} />
          <Route path="/offer-templates" element={<OfferTemplates />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/guide" element={<Welcome />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AppInner />
      </HashRouter>
    </QueryClientProvider>
  )
}
