import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Λάθος email ή κωδικός. Επικοινωνήστε με τον διαχειριστή.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center">
            <Building2 size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-lg">RE Greece</h1>
            <p className="text-xs text-slate-400">Back Office</p>
          </div>
        </div>

        <h2 className="text-slate-700 font-medium mb-6 text-sm">Σύνδεση στο σύστημα</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required autoFocus
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Κωδικός</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors mt-2">
            {loading ? 'Σύνδεση…' : 'Σύνδεση'}
          </button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-6">
          Δεν έχετε λογαριασμό; Επικοινωνήστε με τον διαχειριστή.
        </p>
      </div>
    </div>
  )
}
