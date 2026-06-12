'use client'
// src/app/auth/login/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }
    router.push('/questoes')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#06060f] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Orb de fundo */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #5c5cff, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-[slideUp_0.4s_ease-out]">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, #5c5cff, #a855f7)' }}>
              🎯
            </div>
          </Link>
          <h1 className="text-2xl font-black text-white mb-2">Bem-vindo de volta</h1>
          <p className="text-[var(--text-secondary)] text-sm">Entre para continuar praticando</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">
                E-mail
              </label>
              <input
                type="email"
                className="input"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : (
                <><span>Entrar</span><ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="divider mt-6"><span>ou</span></div>

          <p className="text-center text-sm text-[var(--text-secondary)]">
            Não tem conta?{' '}
            <Link href="/auth/registro" className="text-[#a3a3ff] hover:text-white font-semibold transition-colors">
              Criar conta grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}