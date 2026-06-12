'use client'
// src/app/admin/AdminDashboard.tsx
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Area, Vestibular } from '@/types'
import { Plus, Users, BookOpen, Trophy, BarChart2, Loader2, Check, Zap } from 'lucide-react'

interface RecentQuestion {
  id: string
  enunciado: string
  ano: number
  dificuldade: string
  areas?: { name: string; icon: string; color: string }
  vestibulares?: { name: string }
}

interface Stats {
  totalQuestions: number | null
  totalUsers: number | null
  totalAnswers: number | null
  totalExams: number | null
}

interface Props {
  stats: Stats
  areas: Area[]
  vestibulares: Vestibular[]
  recentQuestions: RecentQuestion[]
}

const EMPTY_FORM = {
  vestibular_id: '',
  area_id: '',
  ano: new Date().getFullYear(),
  numero: '',
  enunciado: '',
  contexto: '',
  gabarito: 'A' as const,
  explicacao: '',
  dificuldade: 'medio' as const,
  alt_a: '', alt_b: '', alt_c: '', alt_d: '', alt_e: '',
}

type FormKey = keyof typeof EMPTY_FORM

export default function AdminDashboard({ stats, areas, vestibulares, recentQuestions }: Props) {
  const supabase = createClient()
  const [tab, setTab] = useState<'dashboard' | 'add-question' | 'generate-exam'>('dashboard')
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  function update(key: FormKey, value: string | number) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const alternativas = [
      { letra: 'A', texto: form.alt_a, correta: form.gabarito === 'A' },
      { letra: 'B', texto: form.alt_b, correta: form.gabarito === 'B' },
      { letra: 'C', texto: form.alt_c, correta: form.gabarito === 'C' },
      { letra: 'D', texto: form.alt_d, correta: form.gabarito === 'D' },
      { letra: 'E', texto: form.alt_e, correta: form.gabarito === 'E' },
    ]

    const { error: err } = await supabase.from('questions').insert({
      vestibular_id: parseInt(form.vestibular_id),
      area_id: parseInt(form.area_id),
      ano: form.ano,
      numero: form.numero ? parseInt(form.numero as string) : null,
      enunciado: form.enunciado,
      contexto: form.contexto || null,
      gabarito: form.gabarito,
      alternativas,
      explicacao: form.explicacao || null,
      dificuldade: form.dificuldade,
    })

    if (err) {
      setError('Erro ao salvar: ' + err.message)
    } else {
      setSuccess('Questão adicionada com sucesso!')
      setForm(EMPTY_FORM)
    }
    setLoading(false)
  }

  async function handleGenerateExam() {
    setLoading(true)
    setError('')
    setSuccess('')
    const { data, error: err } = await supabase.rpc('generate_weekly_exam')
    if (err) setError('Erro ao gerar prova: ' + err.message)
    else setSuccess(`Prova semanal gerada! ID: ${data}`)
    setLoading(false)
  }

  const TABS = [
    { key: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { key: 'add-question', label: 'Adicionar Questão', icon: Plus },
    { key: 'generate-exam', label: 'Gerar Prova', icon: Zap },
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl" style={{ background: 'rgba(251,191,36,0.12)' }}>
          <Trophy size={24} className="text-[#fbbf24]" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Painel Admin</h1>
          <p className="text-[var(--text-secondary)] text-sm">Gerencie questões, provas e usuários</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {TABS.map(t => (
          <button key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              tab === t.key ? 'text-white' : 'text-[var(--text-muted)] hover:text-white'
            }`}
            style={tab === t.key ? {
              background: 'linear-gradient(135deg, #5c5cff, #a855f7)',
            } : {}}>
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {tab === 'dashboard' && (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: BookOpen, label: 'Questões', value: stats.totalQuestions, color: '#5c5cff' },
              { icon: Users, label: 'Usuários', value: stats.totalUsers, color: '#22c55e' },
              { icon: BarChart2, label: 'Respostas', value: stats.totalAnswers, color: '#a855f7' },
              { icon: Trophy, label: 'Provas Semanais', value: stats.totalExams, color: '#fbbf24' },
            ].map(s => (
              <div key={s.label} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <s.icon size={18} style={{ color: s.color }} />
                  <span className="text-xs text-[var(--text-muted)]">{s.label}</span>
                </div>
                <div className="text-3xl font-black text-white">{(s.value || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold text-white mb-4">Últimas questões adicionadas</h2>
            {recentQuestions.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-sm">Nenhuma questão ainda.</p>
            ) : (
              <div className="space-y-3">
                {recentQuestions.map((q) => (
                  <div key={q.id} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <span style={{ color: q.areas?.color }} className="text-lg flex-shrink-0">{q.areas?.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{q.enunciado.substring(0, 80)}…</p>
                      <p className="text-xs text-[var(--text-muted)]">{q.vestibulares?.name} {q.ano} · {q.areas?.name}</p>
                    </div>
                    <span className="badge text-xs" style={{ background: 'rgba(92,92,255,0.12)', color: '#a3a3ff' }}>
                      {q.dificuldade}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Adicionar Questão */}
      {tab === 'add-question' && (
        <div className="card p-6 md:p-8 animate-[fadeIn_0.3s_ease-out]">
          <h2 className="text-lg font-bold text-white mb-6">Nova Questão</h2>
          <form onSubmit={handleAddQuestion} className="space-y-5">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">
                  Vestibular *
                </label>
                <select className="input" value={form.vestibular_id} onChange={e => update('vestibular_id', e.target.value)} required>
                  <option value="">Selecione</option>
                  {vestibulares.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">
                  Disciplina *
                </label>
                <select className="input" value={form.area_id} onChange={e => update('area_id', e.target.value)} required>
                  <option value="">Selecione</option>
                  {areas.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">
                  Ano *
                </label>
                <input type="number" className="input" min={2000} max={2100}
                  value={form.ano} onChange={e => update('ano', parseInt(e.target.value))} required />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">
                  Número da questão
                </label>
                <input type="number" className="input" placeholder="ex: 12"
                  value={form.numero} onChange={e => update('numero', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">
                  Dificuldade
                </label>
                <select className="input" value={form.dificuldade} onChange={e => update('dificuldade', e.target.value)}>
                  <option value="facil">Fácil</option>
                  <option value="medio">Médio</option>
                  <option value="dificil">Difícil</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">
                Contexto / Texto de apoio
              </label>
              <textarea className="input resize-none" rows={3} placeholder="Texto da questão (opcional)..."
                value={form.contexto} onChange={e => update('contexto', e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">
                Enunciado *
              </label>
              <textarea className="input resize-none" rows={4} placeholder="Texto da pergunta..."
                value={form.enunciado} onChange={e => update('enunciado', e.target.value)} required />
            </div>

            {/* Alternativas */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                Alternativas *
              </label>
              {(['A','B','C','D','E'] as const).map(l => {
                const altKey = `alt_${l.toLowerCase()}` as FormKey
                return (
                  <div key={l} className="flex items-center gap-3">
                    <div className={`w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                      form.gabarito === l ? 'text-white' : 'text-[var(--text-muted)]'
                    }`}
                      style={form.gabarito === l ? {
                        background: 'linear-gradient(135deg, #5c5cff, #a855f7)'
                      } : { background: 'rgba(255,255,255,0.06)' }}>
                      {l}
                    </div>
                    <input
                      type="text"
                      className="input flex-1"
                      placeholder={`Alternativa ${l}`}
                      value={form[altKey] as string}
                      onChange={e => update(altKey, e.target.value)}
                      required
                    />
                    <button type="button"
                      onClick={() => update('gabarito', l)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        form.gabarito === l
                          ? 'text-[#86efac]'
                          : 'text-[var(--text-muted)] hover:text-[#86efac]'
                      }`}
                      style={{ background: form.gabarito === l ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)' }}>
                      {form.gabarito === l ? <Check size={14} /> : 'Gabarito'}
                    </button>
                  </div>
                )
              })}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">
                Resolução comentada
              </label>
              <textarea className="input resize-none" rows={4} placeholder="Explicação da resolução (opcional)..."
                value={form.explicacao} onChange={e => update('explicacao', e.target.value)} />
            </div>

            {error && (
              <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(34,197,94,0.1)', color: '#86efac', border: '1px solid rgba(34,197,94,0.2)' }}>
                ✅ {success}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Salvar Questão
            </button>
          </form>
        </div>
      )}

      {/* Gerar Prova Semanal */}
      {tab === 'generate-exam' && (
        <div className="card p-8 text-center max-w-lg animate-[fadeIn_0.3s_ease-out]">
          <div className="p-4 rounded-2xl w-fit mx-auto mb-6" style={{ background: 'rgba(92,92,255,0.12)' }}>
            <Zap size={36} className="text-[#a3a3ff]" />
          </div>
          <h2 className="text-xl font-black text-white mb-3">Gerar Enem do Emman</h2>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-8">
            Gera automaticamente a prova semanal com questões do ENEM e outros vestibulares.
            Dois cadernos: Humanas (45 questões) e Exatas (45 questões).
          </p>
          {error && (
            <div className="p-3 rounded-xl text-sm mb-4" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-xl text-sm mb-4" style={{ background: 'rgba(34,197,94,0.1)', color: '#86efac', border: '1px solid rgba(34,197,94,0.2)' }}>
              ✅ {success}
            </div>
          )}
          <button onClick={handleGenerateExam} disabled={loading} className="btn-primary mx-auto">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            Gerar Prova desta Semana
          </button>
        </div>
      )}
    </div>
  )
}