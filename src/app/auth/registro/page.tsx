'use client'
// src/app/auth/registro/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle } from 'lucide-react'

export default function RegistroPage() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })

    if (error) {
      setError(error.message === 'User already registered'
        ? 'E-mail já cadastrado. Faça login.'
        : 'Erro ao criar conta. Tente novamente.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/questoes'), 2000)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#06060f] flex items-center justify-center px-4">
        <div className="card p-10 text-center max-w-sm w-full animate-[slideUp_0.4s_ease-out]">
          <div className="flex justify-center mb-4">
            <CheckCircle size={48} className="text-[#22c55e]" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Conta criada!</h2>
          <p className="text-[var(--text-secondary)] text-sm">Redirecionando para as questões…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#06060f] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #a855f7, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-[slideUp_0.4s_ease-out]">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, #5c5cff, #a855f7)' }}>
              🎯
            </div>
          </Link>
          <h1 className="text-2xl font-black text-white mb-2">Crie sua conta grátis</h1>
          <p className="text-[var(--text-secondary)] text-sm">Comece a praticar em segundos</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleRegistro} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">
                Nome
              </label>
              <input
                type="text"
                className="input"
                placeholder="Seu nome"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

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
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
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
                <><span>Criar conta</span><ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="divider mt-6"><span>já tem conta?</span></div>

          <p className="text-center text-sm text-[var(--text-secondary)]">
            <Link href="/auth/login" className="text-[#a3a3ff] hover:text-white font-semibold transition-colors">
              Fazer login
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          Ao criar uma conta, você concorda com os termos de uso.
        </p>
      </div>
    </div>
  )
}