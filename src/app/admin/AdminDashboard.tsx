'use client'
// src/app/admin/AdminDashboard.tsx
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Area, Vestibular } from '@/types'
import { Plus, Users, BookOpen, Trophy, BarChart2, Loader2, Check, Zap, Trash2, Search, AlertTriangle } from 'lucide-react'

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
  recentQuestions: any[]
}

const EMPTY_FORM = {
  vestibular_id: '', area_id: '', ano: new Date().getFullYear(),
  numero: '', enunciado: '', contexto: '', gabarito: 'A' as const,
  explicacao: '', dificuldade: 'medio' as const,
  alt_a: '', alt_b: '', alt_c: '', alt_d: '', alt_e: '',
}

export default function AdminDashboard({ stats, areas, vestibulares, recentQuestions }: Props) {
  const supabase = createClient()
  const [tab, setTab] = useState<'dashboard' | 'add' | 'remove' | 'generate'>('dashboard')
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Estado para remoção
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  function update(key: string, value: any) { setForm(prev => ({ ...prev, [key]: value })) }

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    const alternativas = ['A','B','C','D','E'].map(l => ({
      letra: l, texto: (form as any)[`alt_${l.toLowerCase()}`],
      correta: form.gabarito === l,
    }))
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
    if (err) setError('Erro: ' + err.message)
    else { setSuccess('Questão adicionada!'); setForm(EMPTY_FORM) }
    setLoading(false)
  }

  async function handleSearch() {
    if (!searchQ.trim()) return
    setSearchLoading(true)
    const { data } = await supabase
      .from('questions')
      .select('id, enunciado, ano, numero, areas(name, icon), vestibulares(name)')
      .or(`enunciado.ilike.%${searchQ}%,contexto.ilike.%${searchQ}%`)
      .limit(20)
    setSearchResults(data ?? [])
    setSearchLoading(false)
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    // Remove respostas relacionadas primeiro
    await supabase.from('user_answers').delete().eq('question_id', id)
    await supabase.from('weekly_exam_questions').delete().eq('question_id', id)
    const { error: err } = await supabase.from('questions').delete().eq('id', id)
    if (err) { setError('Erro ao deletar: ' + err.message) }
    else {
      setSearchResults(prev => prev.filter(q => q.id !== id))
      setSuccess('Questão removida!')
    }
    setConfirmDelete(null)
    setDeleting(false)
  }

  async function handleGenerateExam() {
    setLoading(true); setError(''); setSuccess('')
    const { data, error: err } = await supabase.rpc('generate_weekly_exam')
    if (err) setError('Erro: ' + err.message)
    else setSuccess(`Prova gerada! ID: ${data}`)
    setLoading(false)
  }

  const TABS = [
    { key: 'dashboard', label: 'Dashboard',        icon: BarChart2 },
    { key: 'add',       label: 'Adicionar Questão', icon: Plus },
    { key: 'remove',    label: 'Remover Questão',   icon: Trash2 },
    { key: 'generate',  label: 'Gerar Prova',       icon: Zap },
  ] as const

  return (
    <div className="space-y-6">
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
      <div className="flex flex-wrap gap-1 p-1 rounded-xl w-fit"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSuccess(''); setError('') }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={tab === t.key ? { background: 'linear-gradient(135deg, #5c5cff, #a855f7)', color: 'white' }
              : { color: 'var(--text-muted)' }}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Alerts */}
      {error && <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>⚠️ {error}</div>}
      {success && <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(34,197,94,0.1)', color: '#86efac', border: '1px solid rgba(34,197,94,0.2)' }}>✅ {success}</div>}

      {/* ── DASHBOARD ── */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: BookOpen, label: 'Questões',       value: stats.totalQuestions, color: '#5c5cff' },
              { icon: Users,    label: 'Usuários',       value: stats.totalUsers,     color: '#22c55e' },
              { icon: BarChart2,label: 'Respostas',      value: stats.totalAnswers,   color: '#a855f7' },
              { icon: Trophy,   label: 'Provas Semanais',value: stats.totalExams,     color: '#fbbf24' },
            ].map(s => (
              <div key={s.label} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <s.icon size={18} style={{ color: s.color }} />
                  <span className="text-xs text-[var(--text-muted)]">{s.label}</span>
                </div>
                <div className="text-3xl font-black text-white">{(s.value ?? 0).toLocaleString('pt-BR')}</div>
              </div>
            ))}
          </div>
          <div className="card p-6">
            <h2 className="text-lg font-bold text-white mb-4">Últimas questões adicionadas</h2>
            {recentQuestions.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-sm">Nenhuma questão ainda.</p>
            ) : (
              <div className="space-y-3">
                {recentQuestions.map((q: any) => (
                  <div key={q.id} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <span className="text-lg flex-shrink-0">{q.areas?.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{q.enunciado?.substring(0, 80)}…</p>
                      <p className="text-xs text-[var(--text-muted)]">{q.vestibulares?.name} {q.ano} · {q.areas?.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ADICIONAR ── */}
      {tab === 'add' && (
        <div className="card p-6 md:p-8">
          <h2 className="text-lg font-bold text-white mb-6">Nova Questão</h2>
          <form onSubmit={handleAddQuestion} className="space-y-5">
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { label: 'Vestibular *', key: 'vestibular_id', opts: vestibulares.map(v => ({ v: String(v.id), l: v.name })) },
                { label: 'Disciplina *', key: 'area_id',       opts: areas.map(a => ({ v: String(a.id), l: `${a.icon} ${a.name}` })) },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">{f.label}</label>
                  <select className="input" value={(form as any)[f.key]} onChange={e => update(f.key, e.target.value)} required>
                    <option value="">Selecione</option>
                    {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Ano *</label>
                <input type="number" className="input" min={2000} max={2100}
                  value={form.ano} onChange={e => update('ano', parseInt(e.target.value))} required />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Número</label>
                <input type="number" className="input" placeholder="ex: 12"
                  value={form.numero} onChange={e => update('numero', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Dificuldade</label>
                <select className="input" value={form.dificuldade} onChange={e => update('dificuldade', e.target.value)}>
                  <option value="facil">Fácil</option>
                  <option value="medio">Médio</option>
                  <option value="dificil">Difícil</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Contexto / Texto de apoio</label>
              <textarea className="input resize-none" rows={3} value={form.contexto} onChange={e => update('contexto', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Enunciado *</label>
              <textarea className="input resize-none" rows={4} value={form.enunciado} onChange={e => update('enunciado', e.target.value)} required />
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Alternativas *</label>
              {(['A','B','C','D','E'] as const).map(l => (
                <div key={l} className="flex items-center gap-3">
                  <div className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={form.gabarito === l ? { background: 'linear-gradient(135deg,#5c5cff,#a855f7)', color: 'white' } : { background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                    {l}
                  </div>
                  <input type="text" className="input flex-1" placeholder={`Alternativa ${l}`}
                    value={(form as any)[`alt_${l.toLowerCase()}`]}
                    onChange={e => update(`alt_${l.toLowerCase()}`, e.target.value)} required />
                  <button type="button" onClick={() => update('gabarito', l)}
                    className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: form.gabarito === l ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)', color: form.gabarito === l ? '#86efac' : 'var(--text-muted)' }}>
                    {form.gabarito === l ? <Check size={14} /> : 'Gabarito'}
                  </button>
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Resolução comentada</label>
              <textarea className="input resize-none" rows={4} value={form.explicacao} onChange={e => update('explicacao', e.target.value)} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Salvar Questão
            </button>
          </form>
        </div>
      )}

      {/* ── REMOVER ── */}
      {tab === 'remove' && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-white mb-2">Remover Questão</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-6">Busque pelo texto da questão para encontrá-la e removê-la.</p>

          <div className="flex gap-3 mb-6">
            <input type="text" className="input flex-1" placeholder="Buscar por texto da questão..."
              value={searchQ} onChange={e => setSearchQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()} />
            <button onClick={handleSearch} disabled={searchLoading} className="btn-primary flex-shrink-0">
              {searchLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Buscar
            </button>
          </div>

          {searchResults.length === 0 && searchQ && !searchLoading && (
            <div className="text-center py-8 text-[var(--text-muted)] text-sm">Nenhuma questão encontrada para "{searchQ}"</div>
          )}

          <div className="space-y-3">
            {searchResults.map(q => (
              <div key={q.id} className="p-4 rounded-xl flex items-start gap-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold" style={{ color: '#a3a3ff' }}>
                      {q.vestibulares?.name} {q.ano}
                    </span>
                    {q.numero && <span className="text-xs text-[var(--text-muted)]">· Q{q.numero}</span>}
                    <span className="text-xs text-[var(--text-muted)]">· {q.areas?.icon} {q.areas?.name}</span>
                  </div>
                  <p className="text-sm text-white leading-relaxed line-clamp-2">
                    {q.enunciado}
                  </p>
                </div>

                {confirmDelete === q.id ? (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-[#fca5a5] mb-1">
                      <AlertTriangle size={12} /> Confirmar?
                    </div>
                    <button onClick={() => handleDelete(q.id)} disabled={deleting}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1"
                      style={{ background: 'rgba(239,68,68,0.8)' }}>
                      {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      Deletar
                    </button>
                    <button onClick={() => setConfirmDelete(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-muted)]"
                      style={{ background: 'rgba(255,255,255,0.05)' }}>
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(q.id)}
                    className="flex-shrink-0 p-2 rounded-xl transition-all hover:scale-105"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── GERAR PROVA ── */}
      {tab === 'generate' && (
        <div className="card p-8 text-center max-w-lg">
          <div className="p-4 rounded-2xl w-fit mx-auto mb-6" style={{ background: 'rgba(92,92,255,0.12)' }}>
            <Zap size={36} className="text-[#a3a3ff]" />
          </div>
          <h2 className="text-xl font-black text-white mb-3">Gerar Enem do Emman</h2>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-8">
            Gera automaticamente a prova semanal com 45 questões de Humanas e 45 de Exatas.
          </p>
          <button onClick={handleGenerateExam} disabled={loading} className="btn-primary mx-auto">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            Gerar Prova desta Semana
          </button>
        </div>
      )}
    </div>
  )
}