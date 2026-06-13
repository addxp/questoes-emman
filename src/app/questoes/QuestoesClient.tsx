'use client'
// src/app/questoes/QuestoesClient.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Question, Area, Vestibular } from '@/types'
import {
  ChevronLeft, ChevronRight, CheckCircle, XCircle,
  BookOpen, ImageOff, SlidersHorizontal, X,
  ArrowLeft, ArrowRight, SkipForward, RotateCcw
} from 'lucide-react'

interface UserAnswerRow {
  question_id: string
  resposta: string
  correta: boolean
}

interface Props {
  questions: Question[]
  areas: Area[]
  vestibulares: Vestibular[]
  userAnswers: UserAnswerRow[]
  total: number
  page: number
  pageSize: number
  filters: Record<string, string | undefined>
}

function extrairImagens(texto: string | null | undefined): { textoLimpo: string; urls: string[] } {
  if (!texto) return { textoLimpo: '', urls: [] }
  const urls: string[] = []
  const regexMd = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g
  const regexUrl = /(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp|svg))/gi
  let limpo = texto.replace(regexMd, (_, url) => { urls.push(url); return '' })
  limpo = limpo.replace(regexUrl, (url) => { if (!urls.includes(url)) urls.push(url); return '' })
  limpo = limpo.replace(/\*\*(.*?)\*\*/g, '$1')
  return { textoLimpo: limpo.trim(), urls }
}

function QuestionImage({ url }: { url: string }) {
  const [broken, setBroken] = useState(false)
  if (broken) return (
    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] p-3 rounded-xl mb-4"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <ImageOff size={13} /> Imagem não disponível
    </div>
  )
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="Imagem da questão" onError={() => setBroken(true)}
      className="rounded-xl max-w-full h-auto mb-4 mx-auto block"
      style={{ maxHeight: 400, objectFit: 'contain', background: 'rgba(255,255,255,0.03)' }} />
  )
}

function QuestionView({ question, globalIndex, total, userAnswer, onAnswer, onNext, onPrev, hasNext, hasPrev }: {
  question: Question
  globalIndex: number
  total: number
  userAnswer?: UserAnswerRow
  onAnswer: (id: string, resposta: string) => void
  onNext: () => void
  onPrev: () => void
  hasNext: boolean
  hasPrev: boolean
}) {
  const [selected, setSelected] = useState<string | null>(userAnswer?.resposta ?? null)
  const [revealed, setRevealed] = useState(!!userAnswer?.resposta)

  const area = question.areas as unknown as Area | undefined
  const vestibular = question.vestibulares as unknown as Vestibular | undefined
  const areaColor = area?.color ?? '#5c5cff'
  const acertou = selected === question.gabarito

  const { textoLimpo: contextoLimpo, urls: urlsContexto } = extrairImagens(question.contexto)
  const { textoLimpo: enunciadoLimpo, urls: urlsEnunciado } = extrairImagens(question.enunciado)
  const todasUrls = [...urlsContexto, ...urlsEnunciado, ...(question.imagem_url ? [question.imagem_url] : [])]
    .filter((u, i, a) => a.indexOf(u) === i)

  function handleAnswer(letra: string) {
    if (revealed) return
    setSelected(letra)
    setRevealed(true)
    onAnswer(question.id, letra)
  }

  function getAltClass(letra: string) {
    if (!revealed) return selected === letra ? 'selected' : ''
    if (letra === question.gabarito) return 'correct'
    if (letra === selected && letra !== question.gabarito) return 'wrong'
    return ''
  }

  return (
    <div className="space-y-4 animate-[fadeIn_0.25s_ease-out]">
      <div className="flex items-center gap-3">
        <span className="text-xs text-[var(--text-muted)] font-medium whitespace-nowrap">{globalIndex} de {total}</span>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(globalIndex / total) * 100}%`, background: `linear-gradient(90deg, ${areaColor}, #a855f7)` }} />
        </div>
        <span className="text-xs text-[var(--text-muted)] font-medium">{Math.round((globalIndex / total) * 100)}%</span>
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between gap-3 flex-wrap"
          style={{ background: `linear-gradient(135deg, ${areaColor}15, transparent)`, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${areaColor}, ${areaColor}88)` }}>
              {globalIndex}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-black text-white">{vestibular?.name ?? 'ENEM'}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-lg"
                  style={{ background: 'rgba(92,92,255,0.15)', color: '#a3a3ff' }}>
                  {question.ano}
                </span>
                {question.numero && <span className="text-xs text-[var(--text-muted)]">· Q{question.numero}</span>}
              </div>
              {area && (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm leading-none">{area.icon}</span>
                  <span className="text-xs font-semibold leading-none" style={{ color: areaColor }}>{area.name}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{
              background: question.dificuldade === 'facil' ? 'rgba(34,197,94,0.12)' : question.dificuldade === 'dificil' ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.1)',
              color: question.dificuldade === 'facil' ? '#86efac' : question.dificuldade === 'dificil' ? '#fca5a5' : '#fde68a',
              border: `1px solid ${question.dificuldade === 'facil' ? 'rgba(34,197,94,0.2)' : question.dificuldade === 'dificil' ? 'rgba(239,68,68,0.18)' : 'rgba(251,191,36,0.18)'}`,
            }}>
              {question.dificuldade === 'facil' ? 'Fácil' : question.dificuldade === 'dificil' ? 'Difícil' : 'Médio'}
            </span>
            {revealed && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: acertou ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)' }}>
                {acertou ? <CheckCircle size={14} className="text-[#22c55e]" /> : <XCircle size={14} className="text-[#ef4444]" />}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 md:p-8">
          {contextoLimpo && (
            <div className="p-4 rounded-2xl mb-6 text-sm text-[var(--text-secondary)] leading-relaxed"
              style={{ background: 'rgba(255,255,255,0.025)', borderLeft: `3px solid ${areaColor}66` }}>
              {contextoLimpo}
            </div>
          )}
          {todasUrls.length > 0 && (
            <div className="mb-5">{todasUrls.map((url, i) => <QuestionImage key={i} url={url} />)}</div>
          )}
          <p className="text-white text-[15px] leading-relaxed mb-7 font-medium">
            {enunciadoLimpo || question.enunciado}
          </p>
          <div className="space-y-2.5">
            {question.alternativas.map((alt) => (
              <button key={alt.letra} onClick={() => handleAnswer(alt.letra)} disabled={revealed}
                className={`alt-option w-full text-left ${getAltClass(alt.letra)}`}>
                <span className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black"
                  style={{ background: 'rgba(92,92,255,0.1)', color: '#a3a3ff', minWidth: 32 }}>
                  {alt.letra}
                </span>
                <span className="text-sm text-[var(--text-secondary)] flex-1 leading-relaxed text-left">{alt.texto}</span>
                {revealed && alt.letra === question.gabarito && <CheckCircle size={15} className="text-[#22c55e] flex-shrink-0" />}
                {revealed && alt.letra === selected && alt.letra !== question.gabarito && <XCircle size={15} className="text-[#ef4444] flex-shrink-0" />}
              </button>
            ))}
          </div>
          {revealed && (
            <div className="mt-6 p-5 rounded-2xl animate-[slideUp_0.3s_ease-out]" style={{
              background: acertou ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.04)',
              border: `1px solid ${acertou ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.12)'}`
            }}>
              <div className="flex items-center gap-2 font-bold text-sm mb-3"
                style={{ color: acertou ? '#86efac' : '#fca5a5' }}>
                {acertou ? <><CheckCircle size={15} /> Correto! Gabarito: {question.gabarito}</> : <><XCircle size={15} /> Incorreto. Gabarito: {question.gabarito}</>}
              </div>
              {question.explicacao ? (
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-2"><BookOpen size={11} /> Resolução</div>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{question.explicacao}</p>
                </div>
              ) : (
                <p className="text-[var(--text-muted)] text-xs italic">Resolução ainda não disponível.</p>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 flex items-center justify-between gap-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)' }}>
          <button onClick={onPrev} disabled={!hasPrev} className="btn-ghost gap-2 disabled:opacity-30 text-sm">
            <ArrowLeft size={15} /> Anterior
          </button>
          {!revealed ? (
            <button onClick={onNext} disabled={!hasNext}
              className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-white transition-colors disabled:opacity-30">
              <SkipForward size={13} /> Pular
            </button>
          ) : (
            <button onClick={onNext} disabled={!hasNext} className="btn-primary text-sm gap-2 disabled:opacity-40">
              {hasNext ? <>Próxima <ArrowRight size={15} /></> : 'Fim desta página'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function QuestoesClient({
  questions, areas, vestibulares, userAnswers, total, page, pageSize, filters
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [currentIndex, setCurrentIndex] = useState(0)
  const answersMap = Object.fromEntries(userAnswers.map(a => [a.question_id, a]))

  const offset = (page - 1) * pageSize
  const totalPages = Math.ceil(total / pageSize)
  const temFiltro = !!(filters.area || filters.vestibular || filters.ano)
  const areaAtiva = areas.find(a => a.slug === filters.area)
  const vestAtivo = vestibulares.find(v => v.slug === filters.vestibular)
  const currentQuestion = questions[currentIndex]
  const globalIndex = offset + currentIndex + 1

  async function handleAnswer(questionId: string, resposta: string) {
    const question = questions.find(q => q.id === questionId)
    if (!question) return
    await supabase.from('user_answers').upsert(
      { question_id: questionId, resposta, correta: resposta === question.gabarito, exam_id: null },
      { onConflict: 'user_id,question_id,exam_id' }
    )
  }

  // ── Filtros: usa window.location para forçar reload completo ──
  function applyFilter(key: string, value: string) {
    const params = new URLSearchParams()
    const current = { ...filters, page: '1', [key]: value }
    Object.entries(current).forEach(([k, v]) => { if (v) params.set(k, v) })
    window.location.href = '/questoes?' + params.toString()
  }

  function removeFilter(key: string) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (k !== key && k !== 'page' && v) params.set(k, v) })
    window.location.href = '/questoes?' + params.toString()
  }

  function clearAllFilters() {
    window.location.href = '/questoes'
  }

  function goNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (page < totalPages) {
      const params = new URLSearchParams()
      Object.entries({ ...filters, page: String(page + 1) }).forEach(([k, v]) => { if (v) params.set(k, v) })
      window.location.href = '/questoes?' + params.toString()
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (page > 1) {
      const params = new URLSearchParams()
      Object.entries({ ...filters, page: String(page - 1) }).forEach(([k, v]) => { if (v) params.set(k, v) })
      window.location.href = '/questoes?' + params.toString()
    }
  }

  const hasNext = currentIndex < questions.length - 1 || page < totalPages
  const hasPrev = currentIndex > 0 || page > 1

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white">Banco de Questões</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-0.5">
          <span className="font-semibold text-white">{total.toLocaleString('pt-BR')}</span> questões
          {areaAtiva && <span> · <span style={{ color: areaAtiva.color ?? '#a3a3ff' }}>{areaAtiva.icon} {areaAtiva.name}</span></span>}
          {vestAtivo && <span> · {vestAtivo.name}</span>}
          {filters.ano && <span> · {filters.ano}</span>}
        </p>
      </div>

      {/* ── Filtros ── */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal size={13} className="text-[var(--text-muted)]" />
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Filtrar por</span>
          {temFiltro && (
            <button onClick={clearAllFilters}
              className="ml-auto flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-white transition-colors px-2 py-1 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <RotateCcw size={10} /> Limpar tudo
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Disciplina */}
          <div className="relative">
            <select
              value={filters.area ?? ''}
              onChange={e => e.target.value ? applyFilter('area', e.target.value) : removeFilter('area')}
              style={{
                appearance: 'none', WebkitAppearance: 'none',
                paddingLeft: 14, paddingRight: 36, paddingTop: 10, paddingBottom: 10,
                borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                outline: 'none', minWidth: 150,
                background: filters.area ? 'rgba(92,92,255,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${filters.area ? 'rgba(92,92,255,0.35)' : 'rgba(255,255,255,0.08)'}`,
                color: filters.area ? '#c4c4ff' : '#9898c8',
              }}>
              <option value="">Disciplina</option>
              {areas.map(a => (
                <option key={a.id} value={a.slug}>{a.name}</option>
              ))}
            </select>
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: filters.area ? '#a3a3ff' : '#5a5a8a' }}>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>

          {/* Vestibular */}
          <div className="relative">
            <select
              value={filters.vestibular ?? ''}
              onChange={e => e.target.value ? applyFilter('vestibular', e.target.value) : removeFilter('vestibular')}
              style={{
                appearance: 'none', WebkitAppearance: 'none',
                paddingLeft: 14, paddingRight: 36, paddingTop: 10, paddingBottom: 10,
                borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                outline: 'none', minWidth: 150,
                background: filters.vestibular ? 'rgba(92,92,255,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${filters.vestibular ? 'rgba(92,92,255,0.35)' : 'rgba(255,255,255,0.08)'}`,
                color: filters.vestibular ? '#c4c4ff' : '#9898c8',
              }}>
              <option value="">Vestibular</option>
              {vestibulares.map(v => (
                <option key={v.id} value={v.slug}>{v.name}</option>
              ))}
            </select>
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: filters.vestibular ? '#a3a3ff' : '#5a5a8a' }}>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>

          {/* Ano */}
          <div className="relative">
            <select
              value={filters.ano ?? ''}
              onChange={e => e.target.value ? applyFilter('ano', e.target.value) : removeFilter('ano')}
              style={{
                appearance: 'none', WebkitAppearance: 'none',
                paddingLeft: 14, paddingRight: 36, paddingTop: 10, paddingBottom: 10,
                borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                outline: 'none', minWidth: 120,
                background: filters.ano ? 'rgba(92,92,255,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${filters.ano ? 'rgba(92,92,255,0.35)' : 'rgba(255,255,255,0.08)'}`,
                color: filters.ano ? '#c4c4ff' : '#9898c8',
              }}>
              <option value="">Ano</option>
              {Array.from({ length: 2024 - 2011 + 1 }, (_, i) => {
                const y = 2024 - i
                return <option key={y} value={String(y)}>{y}</option>
              })}
            </select>
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: filters.ano ? '#a3a3ff' : '#5a5a8a' }}>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </div>

        {/* Tags ativas */}
        {temFiltro && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {filters.area && areaAtiva && (
              <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: (areaAtiva.color ?? '#5c5cff') + '20', color: areaAtiva.color ?? '#a3a3ff', border: `1px solid ${areaAtiva.color ?? '#5c5cff'}35` }}>
                {areaAtiva.icon} {areaAtiva.name}
                <button onClick={() => removeFilter('area')}><X size={10} /></button>
              </span>
            )}
            {filters.vestibular && (
              <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: 'rgba(92,92,255,0.12)', color: '#a3a3ff', border: '1px solid rgba(92,92,255,0.25)' }}>
                {vestibulares.find(v => v.slug === filters.vestibular)?.name}
                <button onClick={() => removeFilter('vestibular')}><X size={10} /></button>
              </span>
            )}
            {filters.ano && (
              <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: 'rgba(251,191,36,0.1)', color: '#fde68a', border: '1px solid rgba(251,191,36,0.2)' }}>
                {filters.ano}
                <button onClick={() => removeFilter('ano')}><X size={10} /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Questão */}
      {questions.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-white font-bold mb-2">Nenhuma questão encontrada</h3>
          <p className="text-[var(--text-secondary)] text-sm">Tente ajustar os filtros acima</p>
        </div>
      ) : currentQuestion ? (
        <QuestionView
          question={currentQuestion}
          globalIndex={globalIndex}
          total={total}
          userAnswer={answersMap[currentQuestion.id]}
          onAnswer={handleAnswer}
          onNext={goNext}
          onPrev={goPrev}
          hasNext={hasNext}
          hasPrev={hasPrev}
        />
      ) : null}

      {/* Mini mapa */}
      {questions.length > 1 && (
        <div className="card p-4">
          <p className="text-xs text-[var(--text-muted)] mb-3 font-semibold uppercase tracking-wider">Questões desta página</p>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, i) => {
              const ans = answersMap[q.id]
              const isActive = i === currentIndex
              return (
                <button key={q.id}
                  onClick={() => { setCurrentIndex(i); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  className="w-9 h-9 rounded-xl text-xs font-bold transition-all duration-150 flex-shrink-0"
                  style={isActive ? {
                    background: 'linear-gradient(135deg, #5c5cff, #a855f7)', color: 'white', boxShadow: '0 0 12px rgba(92,92,255,0.4)',
                  } : ans ? {
                    background: ans.correta ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)',
                    color: ans.correta ? '#86efac' : '#fca5a5',
                    border: `1px solid ${ans.correta ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.25)'}`,
                  } : {
                    background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.07)',
                  }}>
                  {offset + i + 1}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {[
              { color: 'linear-gradient(135deg, #5c5cff, #a855f7)', label: 'Atual' },
              { color: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', label: 'Acertou' },
              { color: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', label: 'Errou' },
              { color: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', label: 'Pendente' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: s.color, border: s.border }} />
                {s.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}