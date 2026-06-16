// src/app/admin/AdminDashboard.tsx
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Area, Vestibular } from '@/types'
import {
  Plus, Users, BookOpen, Trophy, BarChart2,
  Loader2, Check, Zap, Trash2, Search,
  AlertTriangle, Mail, Send
} from 'lucide-react'

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
  recentQuestions: Record<string, unknown>[]
  users: { id: string; email: string; name: string | null }[]
}

const EMPTY_FORM = {
  vestibular_id: '', area_id: '', ano: new Date().getFullYear(),
  numero: '', enunciado: '', contexto: '', gabarito: 'A' as const,
  explicacao: '', dificuldade: 'medio' as const,
  alt_a: '', alt_b: '', alt_c: '', alt_d: '', alt_e: '',
}

export default function AdminDashboard({ stats, areas, vestibulares, recentQuestions, users }: Props) {
  const supabase = createClient()
  const [tab, setTab] = useState<'dashboard' | 'add' | 'remove' | 'generate' | 'ping'>('dashboard')
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Remoção
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<Record<string, unknown>[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Ping
  const [pingTitle, setPingTitle] = useState('')
  const [pingMsg, setPingMsg] = useState('')
  const [pingLoading, setPingLoading] = useState(false)

  function update(key: string, value: unknown) { setForm(prev => ({ ...prev, [key]: value })) }

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    const alternativas = ['A','B','C','D','E'].map(l => ({
      letra: l,
      texto: (form as Record<string, unknown>)[`alt_${l.toLowerCase()}`] as string,
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
    const { data, error: err } = await supabase
      .from('questions')
      .select('id, enunciado, ano, numero, areas(name, icon), vestibulares(name)')
      .or(`enunciado.ilike.%${searchQ}%,contexto.ilike.%${searchQ}%`)
      .limit(20)
    if (err) setError('Erro na busca: ' + err.message)
    setSearchResults(data ?? [])
    setSearchLoading(false)
  }

  async function handleDelete(id: string) {
    setDeleting(true); setError(''); setSuccess('')
    try {
      // Usa service role via API route para garantir permissão
      const res = await fetch('/api/admin/delete-question', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro desconhecido')
      setSearchResults(prev => prev.filter(q => (q.id as string) !== id))
      setSuccess('Questão removida com sucesso!')
    } catch (err: unknown) {
      setError('Erro ao deletar: ' + (err instanceof Error ? err.message : String(err)))
    }
    setConfirmDelete(null)
    setDeleting(false)
  }

  async function handleGenerateExam() {
    setLoading(true); setError(''); setSuccess('')
    const { data, error: err } = await supabase.rpc('generate_weekly_exam')
    if (err) setError('Erro: ' + err.message)
    else setSuccess(`Prova gerada com sucesso! ID: ${data}`)
    setLoading(false)
  }

  async function handlePing() {
    if (!pingTitle.trim() || !pingMsg.trim()) { setError('Preencha título e mensagem.'); return }
    setPingLoading(true); setError(''); setSuccess('')
    const res = await fetch('/api/admin/ping-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: pingTitle, message: pingMsg }),
    })
    const json = await res.json()
    if (!res.ok) setError(json.error ?? 'Erro ao enviar')
    else {
      setSuccess(`✅ E-mail enviado para ${json.sent} usuários!`)
      setPingTitle(''); setPingMsg('')
    }
    setPingLoading(false)
  }

  const TABS = [
    { key: 'dashboard', label: 'Dashboard',         icon: BarChart2 },
    { key: 'add',       label: 'Adicionar',          icon: Plus },
    { key: 'remove',    label: 'Remover Questão',    icon: Trash2 },
    { key: 'generate',  label: 'Gerar Prova',        icon: Zap },
    { key: 'ping',      label: 'Ping Usuários',      icon: Mail },
  ] as const

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl" style={{ background: 'rgba(251,191,36,0.12)' }}>
          <Trophy size={24} className="text-[#fbbf24]" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Painel Admin</h1>
          <p className="text-[var(--text-secondary)] text-sm">{stats.totalUsers ?? 0} usuários · {stats.totalQuestions ?? 0} questões</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 p-1 rounded-xl w-fit"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSuccess(''); setError('') }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={tab === t.key
              ? { background: 'linear-gradient(135deg, #5c5cff, #a855f7)', color: 'white' }
              : { color: 'var(--text-muted)' }}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {error   && <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)',  color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)'  }}>⚠️ {error}</div>}
      {success && <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(34,197,94,0.1)', color: '#86efac', border: '1px solid rgba(34,197,94,0.2)' }}>✅ {success}</div>}

      {/* ── DASHBOARD ── */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: BookOpen,  label: 'Questões',        value: stats.totalQuestions, color: '#5c5cff' },
              { icon: Users,     label: 'Usuários',        value: stats.totalUsers,     color: '#22c55e' },
              { icon: BarChart2, label: 'Respostas',       value: stats.totalAnswers,   color: '#a855f7' },
              { icon: Trophy,    label: 'Provas Semanais', value: stats.totalExams,     color: '#fbbf24' },
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

          {/* Lista de usuários */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Users size={18} className="text-[var(--text-muted)]" /> Usuários cadastrados
            </h2>
            <div className="space-y-2">
              {users.slice(0, 10).map(u => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #5c5cff, #a855f7)' }}>
                    {(u.name || u.email)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">{u.name || 'Sem nome'}</div>
                    <div className="text-xs text-[var(--text-muted)] truncate">{u.email}</div>
                  </div>
                </div>
              ))}
              {users.length > 10 && (
                <p className="text-xs text-[var(--text-muted)] text-center pt-2">
                  +{users.length - 10} outros usuários
                </p>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold text-white mb-4">Últimas questões</h2>
            <div className="space-y-3">
              {recentQuestions.map((q) => {
                const area = q.areas as Record<string, unknown> | undefined
                const vest = q.vestibulares as Record<string, unknown> | undefined
                return (
                  <div key={q.id as string} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <span className="text-lg flex-shrink-0">{area?.icon as string}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{(q.enunciado as string)?.substring(0, 80)}…</p>
                      <p className="text-xs text-[var(--text-muted)]">{vest?.name as string} {q.ano as number} · {area?.name as string}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── ADICIONAR ── */}
      {tab === 'add' && (
        <div className="card p-6 md:p-8">
          <h2 className="text-lg font-bold text-white mb-6">Nova Questão</h2>
          <form onSubmit={handleAddQuestion} className="space-y-5">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Vestibular *</label>
                <select className="input" value={form.vestibular_id} onChange={e => update('vestibular_id', e.target.value)} required>
                  <option value="">Selecione</option>
                  {vestibulares.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Disciplina *</label>
                <select className="input" value={form.area_id} onChange={e => update('area_id', e.target.value)} required>
                  <option value="">Selecione</option>
                  {areas.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Ano *</label>
                <input type="number" className="input" min={2000} max={2100}
                  value={form.ano} onChange={e => update('ano', parseInt(e.target.value))} required />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Número</label>
                <input type="number" className="input" placeholder="ex: 12" value={form.numero} onChange={e => update('numero', e.target.value)} />
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
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Contexto</label>
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
                    style={form.gabarito === l
                      ? { background: 'linear-gradient(135deg,#5c5cff,#a855f7)', color: 'white' }
                      : { background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                    {l}
                  </div>
                  <input type="text" className="input flex-1" placeholder={`Alternativa ${l}`}
                    value={(form as Record<string, unknown>)[`alt_${l.toLowerCase()}`] as string}
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
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Salvar Questão
            </button>
          </form>
        </div>
      )}

      {/* ── REMOVER ── */}
      {tab === 'remove' && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-white mb-2">Remover Questão</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-6">Busque pelo texto para encontrar e remover questões.</p>
          <div className="flex gap-3 mb-6">
            <input type="text" className="input flex-1" placeholder="Digite parte do enunciado..."
              value={searchQ} onChange={e => setSearchQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()} />
            <button onClick={handleSearch} disabled={searchLoading} className="btn-primary flex-shrink-0">
              {searchLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Buscar
            </button>
          </div>

          {searchResults.length === 0 && searchQ && !searchLoading && (
            <p className="text-center py-8 text-[var(--text-muted)] text-sm">Nenhuma questão encontrada.</p>
          )}

          <div className="space-y-3">
            {searchResults.map(q => {
              const area = q.areas as Record<string, unknown> | undefined
              const vest = q.vestibulares as Record<string, unknown> | undefined
              return (
                <div key={q.id as string} className="p-4 rounded-xl flex items-start gap-4"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-semibold" style={{ color: '#a3a3ff' }}>{vest?.name as string} {q.ano as number}</span>
                      {q.numero && <span className="text-xs text-[var(--text-muted)]">· Q{q.numero as number}</span>}
                      <span className="text-xs text-[var(--text-muted)]">· {area?.icon as string} {area?.name as string}</span>
                    </div>
                    <p className="text-sm text-white leading-relaxed line-clamp-2">{q.enunciado as string}</p>
                  </div>

                  {confirmDelete === (q.id as string) ? (
                    <div className="flex flex-col gap-2 flex-shrink-0 items-end">
                      <div className="flex items-center gap-1 text-xs text-[#fca5a5]">
                        <AlertTriangle size={12} /> Tem certeza?
                      </div>
                      <button onClick={() => handleDelete(q.id as string)} disabled={deleting}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1"
                        style={{ background: '#ef4444' }}>
                        {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Confirmar
                      </button>
                      <button onClick={() => setConfirmDelete(null)}
                        className="px-3 py-1.5 rounded-lg text-xs text-[var(--text-muted)]"
                        style={{ background: 'rgba(255,255,255,0.05)' }}>
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(q.id as string)}
                      className="flex-shrink-0 p-2 rounded-xl transition-all hover:scale-105"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              )
            })}
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
          <p className="text-[var(--text-secondary)] text-sm mb-8">45 questões de Humanas + 45 de Exatas, geradas aleatoriamente.</p>
          <button onClick={handleGenerateExam} disabled={loading} className="btn-primary mx-auto">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />} Gerar Prova
          </button>
        </div>
      )}

      {/* ── PING USUÁRIOS ── */}
      {tab === 'ping' && (
        <div className="card p-6 md:p-8 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(92,92,255,0.12)' }}>
              <Mail size={22} className="text-[#a3a3ff]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Ping — Mencionar Todos</h2>
              <p className="text-[var(--text-secondary)] text-sm">Envia e-mail para todos os {users.length} usuários cadastrados</p>
            </div>
          </div>

          <div className="p-4 rounded-xl mb-6 text-sm"
            style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fde68a' }}>
            ⚠️ Este e-mail será enviado para <strong>todos os usuários</strong>. Use com moderação.
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Assunto</label>
              <input type="text" className="input" placeholder="ex: Nova prova semanal disponível!"
                value={pingTitle} onChange={e => setPingTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Mensagem</label>
              <textarea className="input resize-none" rows={6}
                placeholder="Escreva a mensagem que será enviada para todos os usuários..."
                value={pingMsg} onChange={e => setPingMsg(e.target.value)} />
            </div>

            {/* Preview dos destinatários */}
            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs font-semibold text-[var(--text-muted)] mb-3 uppercase tracking-wide">
                Destinatários ({users.length})
              </p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {users.map(u => (
                  <span key={u.id} className="text-xs px-2 py-1 rounded-full"
                    style={{ background: 'rgba(92,92,255,0.1)', color: '#a3a3ff', border: '1px solid rgba(92,92,255,0.2)' }}>
                    {u.email}
                  </span>
                ))}
              </div>
            </div>

            <button onClick={handlePing} disabled={pingLoading || !pingTitle || !pingMsg}
              className="btn-primary w-full justify-center disabled:opacity-40">
              {pingLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Enviar para todos os usuários
            </button>
          </div>
        </div>
      )}
    </div>
  )
}