import { useState } from 'react'
import { ShieldCheck, UserPlus, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types/api'
import { cn } from '../lib/cn'

export function LoginScreen() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('AUDITOR')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        await login(username, password)
      } else {
        await register(username, password, role)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-bg flex min-h-screen items-center justify-center p-6">
      <div className="glass-panel neon-border-emerald w-full max-w-md rounded-2xl p-8 shadow-2xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/15 p-3 text-emerald-400">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-semibold text-slate-100">ClaimsAuditor AI</h1>
            <p className="text-sm text-slate-400">Enterprise compliance auditing platform</p>
          </div>
        </div>

        <div className="mb-6 flex rounded-lg bg-slate-800/80 p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition',
              mode === 'login' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-200',
            )}
          >
            <LogIn className="h-4 w-4" /> Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition',
              mode === 'register' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-200',
            )}
          >
            <UserPlus className="h-4 w-4" /> Enroll
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wide text-slate-400">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100 outline-none ring-emerald-500/40 focus:ring-2"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wide text-slate-400">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100 outline-none ring-emerald-500/40 focus:ring-2"
            />
          </label>

          {mode === 'register' && (
            <label className="block space-y-1">
              <span className="text-xs uppercase tracking-wide text-slate-400">Role</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100 outline-none ring-emerald-500/40 focus:ring-2"
              >
                <option value="AUDITOR">AUDITOR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </label>
          )}

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 font-medium text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Access Dashboard' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
