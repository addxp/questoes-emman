'use client'
// src/app/questoes/QuestoesClient.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Question, Area, Vestibular } from '@/types'
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, BookOpen, ImageOff, SlidersHorizontal, X } from 'lucide-react'

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

function extrairImagensDoTexto(texto: string | null | undefined): { textoLimpo: string; urls: string[] } {
  if (!texto) return { textoLimpo: '', urls: [] }
  const urls: string[] = []
  const regexMarkdown = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g
  const regexUrl = /(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp|svg))/gi
  let limpo = texto.replace(regexMarkdown, (_, url) => { urls.push(url); return '' })
  limpo = limpo.replace(regexUrl, (url) => { if (!urls.includes(url)) urls.push(url); return '' })
  // Remove markdown bold **texto**
  limpo = limpo.replace(/\*\*(.*?)\*\*/g, '$1')
  return { textoLimpo: limpo.trim(), urls }
}

function QuestionImage({ url }: { url: string }) {
  const [broken, setBroken] = useState(false)
  if (broken) return (
    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] p-3 rounded-xl mb-3"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <ImageOff size={13} /> Imagem não disponível
    </div>
  )
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="Imagem da questão" onError={() => setBroken(true)}
      className="rounded-xl max-w-full h-auto mb-4 mx-auto block"
      style={{ maxHeight: 420, objectFit: 'contain', background: 'rgba(255,255,255,0.03)' }} />
  )
}

function QuestionCard({ question, index, userAnswer, onAnswer }: {
  question: Question
  index: number
  userAnswer?: UserAnswerRow
  onAnswer: (id: string, resposta: string) => void
}) {
  const [selected, setSelected] = useState<string | null>(userAnswer?.resposta ?? null)
  const [revealed, setRevealed] = useState(!!userAnswer?.resposta)

  const area = question.areas as unknown as Area | undefined
  const vestibular = question.vestibulares as unknown as Vestibular | undefined
  const areaColor = area?.color ?? '#5c5cff'
  const acertou = selected === question.gabarito

  const { textoLimpo: contextoLimpo, urls: urlsContexto } = extrairImagensDoTexto(question.contexto)
  const { textoLimpo: enunciadoLimpo, urls: urlsEnunciado } = extrairImagensDoTexto(question.enunciado)
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
    <div className="card overflow-hidden animate-[fadeIn_0.3s_ease-out]">
      {/* Cabeçalho colorido da questão */}
      <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3"
        style={{ background: `linear-gradient(135deg, ${areaColor}18, transparent)`, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>

        {/* Lado esquerdo: número + vestibular + área */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Número da questão */}
          <div className="flex items-center justify-center w-9 h-9 rounded-xl font-black text-sm text-white flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${areaColor}, ${areaColor}99)` }}>
            {index}
          </div>

          <div className="flex flex-col gap-0.5">
            {/* Vestibular + Ano */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white tracking-wide">
                {vestibular?.name ?? 'ENEM'}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md"
                style={{ background: 'rgba(92,92,255,0.15)', color: '#a3a3ff' }}>
                {question.ano}
              </span>
              {question.numero && (
                <span className="text-xs text-[var(--text-muted)]">· Q{question.numero}</span>
              )}
            </div>
            {/* Área */}
            {area && (
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{area.icon}</span>
                <span className="text-xs font-semibold" style={{ color: areaColor }}>
                  {area.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Lado direito: dificuldade + status */}
        <div className="flex items-center gap-2">
          <span className="badge text-xs" style={{
            background: question.dificuldade === 'facil' ? 'rgba(34,197,94,0.12)'
              : question.dificuldade === 'dificil' ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.1)',
            color: question.dificuldade === 'facil' ? '#86efac'
              : question.dificuldade === 'dificil' ? '#fca5a5' : '#fde68a',
            border: `1px solid ${question.dificuldade === 'facil' ? 'rgba(34,197,94,0.25)'
              : question.dificuldade === 'dificil' ? 'rgba(239,68,68,0.2)' : 'rgba(251,191,36,0.2)'}`,
            textTransform: 'capitalize',
          }}>
            {question.dificuldade === 'facil' ? 'Fácil' : question.dificuldade === 'dificil' ? 'Difícil' : 'Médio'}
          </span>
          {revealed && (
            <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: acertou ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.1)' }}>
              {acertou
                ? <CheckCircle size={14} className="text-[#22c55e]" />
                : <XCircle size={14} className="text-[#ef4444]" />}
            </span>
          )}
        </div>
      </div>

      {/* Corpo da questão */}
      <div className="p-6 md:p-8">
        {/* Contexto */}
        {contextoLimpo && (
          <div className="p-4 rounded-2xl mb-5 text-sm text-[var(--text-secondary)] leading-relaxed"
            style={{ background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${areaColor}88` }}>
            {contextoLimpo}
          </div>
        )}

        {/* Imagens */}
        {todasUrls.length > 0 && (
          <div className="mb-5">
            {todasUrls.map((url, i) => <QuestionImage key={i} url={url} />)}
          </div>
        )}

        {/* Enunciado */}
        <p className="text-white text-[15px] leading-relaxed mb-6 font-medium">
          {enunciadoLimpo || question.enunciado}
        </p>

        {/* Alternativas */}
        <div className="space-y-2.5">
          {question.alternativas.map((alt) => (
            <button key={alt.letra} onClick={() => handleAnswer(alt.letra)} disabled={revealed}
              className={`alt-option w-full text-left ${getAltClass(alt.letra)}`}>
              <span className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black"
                style={{ background: 'rgba(92,92,255,0.12)', color: '#a3a3ff', minWidth: 32 }}>
                {alt.letra}
              </span>
              <span className="text-sm text-[var(--text-secondary)] flex-1 leading-relaxed text-left">
                {alt.texto}
              </span>
              {revealed && alt.letra === question.gabarito && <CheckCircle size={15} className="text-[#22c55e] flex-shrink-0" />}
              {revealed && alt.letra === selected && alt.letra !== question.gabarito && <XCircle size={15} className="text-[#ef4444] flex-shrink-0" />}
            </button>
          ))}
        </div>

        {/* Resolução */}
        {revealed && (
          <div className="mt-5 p-4 rounded-2xl text-sm animate-[slideUp_0.3s_ease-out]" style={{
            background: acertou ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.04)',
            border: `1px solid ${acertou ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.12)'}`
          }}>
            <div className="flex items-center gap-2 font-bold mb-2 text-sm"
              style={{ color: acertou ? '#86efac' : '#fca5a5' }}>
              {acertou
                ? <><CheckCircle size={14} /> Correto! Gabarito: alternativa {question.gabarito}</>
                : <><XCircle size={14} /> Incorreto. Gabarito: alternativa {question.gabarito}</>}
            </div>
            {question.explicacao ? (
              <div>
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-1.5">
                  <BookOpen size={11} /> Resolução comentada
                </div>
                <p className="text-[var(--text-secondary)] leading-relaxed text-[13px]">{question.explicacao}</p>
              </div>
            ) : (
              <p className="text-[var(--text-muted)] text-xs italic mt-1">Resolução ainda não disponível para esta questão.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Componente de filtro bonito ───────────────────────────────
function FilterSelect({ value, onChange, placeholder, options }: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: { value: string; label: string }[]
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none pl-4 pr-9 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200"
        style={{
          background: value ? 'rgba(92,92,255,0.12)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${value ? 'rgba(92,92,255,0.35)' : 'rgba(255,255,255,0.08)'}`,
          color: value ? '#c4c4ff' : 'var(--text-secondary)',
          outline: 'none',
          minWidth: 160,
        }}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: value ? '#a3a3ff' : 'var(--text-muted)' }}>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  )
}

export default function QuestoesClient({
  questions, areas, vestibulares, userAnswers, total, page, pageSize, filters
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const totalPages = Math.ceil(total / pageSize)
  const answersMap = Object.fromEntries(userAnswers.map(a => [a.question_id, a]))
  const temFiltro = !!(filters.area || filters.vestibular || filters.ano)

  // Offset para número da questão na página atual
  const offset = (page - 1) * pageSize

  async function handleAnswer(questionId: string, resposta: string) {
    const question = questions.find(q => q.id === questionId)
    if (!question) return
    await supabase.from('user_answers').upsert(
      { question_id: questionId, resposta, correta: resposta === question.gabarito, exam_id: null },
      { onConflict: 'user_id,question_id,exam_id' }
    )
  }

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams()
    Object.entries({ ...filters, [key]: value, page: '1' }).forEach(([k, v]) => { if (v) params.set(k, v) })
    router.push('/questoes?' + params.toString())
  }

  function clearFilter(key: string) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (k !== key && k !== 'page' && v) params.set(k, v) })
    router.push('/questoes?' + params.toString())
  }

  const areaAtiva = areas.find(a => a.slug === filters.area)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Banco de Questões</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            <span className="font-semibold text-white">{total.toLocaleString('pt-BR')}</span> questões
            {areaAtiva && <span> de <span style={{ color: areaAtiva.color ?? '#a3a3ff' }}>{areaAtiva.icon} {areaAtiva.name}</span></span>}
            {filters.vestibular && <span> · {vestibulares.find(v => v.slug === filters.vestibular)?.name}</span>}
            {filters.ano && <span> · {filters.ano}</span>}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal size={14} className="text-[var(--text-muted)]" />
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Filtrar por</span>
          {temFiltro && (
            <button onClick={() => router.push('/questoes')}
              className="ml-auto flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-white transition-colors px-2 py-1 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <X size={11} /> Limpar
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterSelect
            value={filters.area ?? ''}
            onChange={v => v ? updateFilter('area', v) : clearFilter('area')}
            placeholder="📚 Disciplina"
            options={areas.map(a => ({ value: a.slug, label: `${a.icon} ${a.name}` }))}
          />
          <FilterSelect
            value={filters.vestibular ?? ''}
            onChange={v => v ? updateFilter('vestibular', v) : clearFilter('vestibular')}
            placeholder="🏫 Vestibular"
            options={vestibulares.map(v => ({ value: v.slug, label: v.name }))}
          />
          <FilterSelect
            value={filters.ano ?? ''}
            onChange={v => v ? updateFilter('ano', v) : clearFilter('ano')}
            placeholder="📅 Ano"
            options={Array.from({ length: 2024 - 2011 + 1 }, (_, i) => {
              const y = 2024 - i
              return { value: String(y), label: String(y) }
            })}
          />
        </div>

        {/* Tags de filtros ativos */}
        {temFiltro && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {filters.area && areaAtiva && (
              <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium"
                style={{ background: (areaAtiva.color ?? '#5c5cff') + '20', color: areaAtiva.color ?? '#a3a3ff', border: `1px solid ${areaAtiva.color ?? '#5c5cff'}40` }}>
                {areaAtiva.icon} {areaAtiva.name}
                <button onClick={() => clearFilter('area')} className="hover:opacity-70"><X size={10} /></button>
              </span>
            )}
            {filters.vestibular && (
              <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium"
                style={{ background: 'rgba(92,92,255,0.12)', color: '#a3a3ff', border: '1px solid rgba(92,92,255,0.25)' }}>
                🏫 {vestibulares.find(v => v.slug === filters.vestibular)?.name}
                <button onClick={() => clearFilter('vestibular')} className="hover:opacity-70"><X size={10} /></button>
              </span>
            )}
            {filters.ano && (
              <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium"
                style={{ background: 'rgba(251,191,36,0.1)', color: '#fde68a', border: '1px solid rgba(251,191,36,0.2)' }}>
                📅 {filters.ano}
                <button onClick={() => clearFilter('ano')} className="hover:opacity-70"><X size={10} /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Lista */}
      {questions.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-white font-bold mb-2">Nenhuma questão encontrada</h3>
          <p className="text-[var(--text-secondary)] text-sm">Tente ajustar os filtros acima</p>
        </div>
      ) : (
        <div className="space-y-5 stagger-in">
          {questions.map((q, i) => (
            <QuestionCard key={q.id} question={q} index={offset + i + 1}
              userAnswer={answersMap[q.id]} onAnswer={handleAnswer} />
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={() => updateFilter('page', String(page - 1))} disabled={page <= 1}
            className="btn-ghost gap-1.5 disabled:opacity-30">
            <ChevronLeft size={15} /> Anterior
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page - 2 + i
              if (p < 1 || p > totalPages) return null
              return (
                <button key={p} onClick={() => updateFilter('page', String(p))}
                  className="w-9 h-9 rounded-xl text-sm font-semibold transition-all"
                  style={p === page ? {
                    background: 'linear-gradient(135deg, #5c5cff, #a855f7)',
                    color: 'white',
                  } : {
                    color: 'var(--text-muted)',
                    background: 'rgba(255,255,255,0.04)',
                  }}>
                  {p}
                </button>
              )
            })}
          </div>
          <button onClick={() => updateFilter('page', String(page + 1))} disabled={page >= totalPages}
            className="btn-ghost gap-1.5 disabled:opacity-30">
            Próxima <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  )
}