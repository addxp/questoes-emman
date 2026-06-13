'use client'
// src/app/questoes/QuestoesClient.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Question, Area, Vestibular } from '@/types'
import { Filter, ChevronLeft, ChevronRight, CheckCircle, XCircle, BookOpen, ImageOff } from 'lucide-react'

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

function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || url.trim() === '') return false
  if (url.includes('undefined') || url.includes('null') || url.includes('placeholder')) return false
  try { new URL(url); return true } catch { return false }
}

function QuestionImage({ url }: { url: string }) {
  const [broken, setBroken] = useState(false)
  if (broken) {
    return (
      <div className="mb-4 flex items-center gap-2 text-xs text-[var(--text-muted)] p-3 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <ImageOff size={14} /> Imagem não disponível
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="Imagem da questão" onError={() => setBroken(true)}
      className="mb-4 rounded-xl max-w-full h-auto" style={{ maxHeight: 400, objectFit: 'contain' }} />
  )
}

function QuestionCard({ question, userAnswer, onAnswer }: {
  question: Question
  userAnswer?: UserAnswerRow
  onAnswer: (id: string, resposta: string) => void
}) {
  const [selected, setSelected] = useState<string | null>(userAnswer?.resposta ?? null)
  const [revealed, setRevealed] = useState(!!userAnswer?.resposta)

  const area = question.areas as unknown as Area | undefined
  const vestibular = question.vestibulares as unknown as Vestibular | undefined
  const areaColor = area?.color ?? '#5c5cff'
  const acertou = selected === question.gabarito

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
    <div className="card p-6 md:p-8 animate-[fadeIn_0.3s_ease-out]">
      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {area && (
          <span className="badge" style={{
            background: areaColor + '22', color: areaColor, border: `1px solid ${areaColor}44`
          }}>
            {area.icon} {area.name}
          </span>
        )}
        <span className="badge" style={{
          background: 'rgba(92,92,255,0.12)', color: '#a3a3ff', border: '1px solid rgba(92,92,255,0.2)'
        }}>
          {vestibular?.name} {question.ano}
        </span>
        {question.numero && (
          <span className="badge" style={{
            background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.07)'
          }}>
            Q{question.numero}
          </span>
        )}
        <span className="badge ml-auto" style={{
          background: question.dificuldade === 'facil' ? 'rgba(34,197,94,0.12)'
            : question.dificuldade === 'dificil' ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.1)',
          color: question.dificuldade === 'facil' ? '#86efac'
            : question.dificuldade === 'dificil' ? '#fca5a5' : '#fde68a',
          border: `1px solid ${question.dificuldade === 'facil' ? 'rgba(34,197,94,0.25)'
            : question.dificuldade === 'dificil' ? 'rgba(239,68,68,0.2)' : 'rgba(251,191,36,0.2)'}`
        }}>
          {question.dificuldade}
        </span>
      </div>

      {/* Contexto */}
      {question.contexto && (
        <div className="p-4 rounded-xl mb-4 text-sm text-[var(--text-secondary)] leading-relaxed"
          style={{ background: 'rgba(255,255,255,0.03)', borderLeft: '2px solid rgba(92,92,255,0.4)' }}>
          {question.contexto}
        </div>
      )}

      {/* Imagem */}
      {isValidImageUrl(question.imagem_url) && <QuestionImage url={question.imagem_url!} />}

      {/* Enunciado */}
      <p className="text-white text-base leading-relaxed mb-6">{question.enunciado}</p>

      {/* Alternativas */}
      <div className="space-y-2">
        {question.alternativas.map((alt) => (
          <button key={alt.letra} onClick={() => handleAnswer(alt.letra)} disabled={revealed}
            className={`alt-option w-full text-left ${getAltClass(alt.letra)}`}>
            <span className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: 'rgba(92,92,255,0.15)', color: '#a3a3ff' }}>
              {alt.letra}
            </span>
            <span className="text-sm text-[var(--text-secondary)] flex-1 leading-relaxed text-left">
              {alt.texto}
            </span>
            {revealed && alt.letra === question.gabarito && <CheckCircle size={16} className="text-[#22c55e] flex-shrink-0" />}
            {revealed && alt.letra === selected && alt.letra !== question.gabarito && <XCircle size={16} className="text-[#ef4444] flex-shrink-0" />}
          </button>
        ))}
      </div>

      {/* Feedback após responder */}
      {revealed && (
        <div className="mt-5 p-4 rounded-xl text-sm animate-[slideUp_0.3s_ease-out]" style={{
          background: acertou ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.05)',
          border: `1px solid ${acertou ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.15)'}`
        }}>
          <div className="font-semibold flex items-center gap-2 mb-2"
            style={{ color: acertou ? '#86efac' : '#fca5a5' }}>
            {acertou
              ? <><CheckCircle size={14} /> Correto! Gabarito: {question.gabarito}</>
              : <><XCircle size={14} /> Incorreto. Gabarito: {question.gabarito}</>
            }
          </div>
          {question.explicacao ? (
            <>
              <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] mb-1">
                <BookOpen size={11} /> Resolução
              </div>
              <p className="text-[var(--text-secondary)] leading-relaxed">{question.explicacao}</p>
            </>
          ) : (
            <p className="text-[var(--text-muted)] text-xs italic">Resolução ainda não disponível.</p>
          )}
        </div>
      )}
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

  const areaAtiva = areas.find(a => a.slug === filters.area)
  const vestAtivo = vestibulares.find(v => v.slug === filters.vestibular)

  // Descrição do total sem typo
  const totalStr = total === 1 ? '1 questão' : `${total.toLocaleString('pt-BR')} questões`

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
    Object.entries({ ...filters, [key]: value, page: '1' }).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    router.push('/questoes?' + params.toString())
  }

  function clearFilter(key: string) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
      if (k !== key && k !== 'page' && v) params.set(k, v)
    })
    router.push('/questoes?' + params.toString())
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Banco de Questões</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          {totalStr}
          {areaAtiva ? ` · ${areaAtiva.icon} ${areaAtiva.name}` : ''}
          {vestAtivo ? ` · ${vestAtivo.name}` : ''}
          {filters.ano ? ` · ${filters.ano}` : ''}
        </p>
      </div>

      {/* Filtros */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <Filter size={14} className="text-[var(--text-muted)]" />

        <select className="input w-auto text-sm py-2"
          value={filters.area ?? ''}
          onChange={e => e.target.value ? updateFilter('area', e.target.value) : clearFilter('area')}>
          <option value="">Todas as disciplinas</option>
          {areas.map(a => <option key={a.id} value={a.slug}>{a.icon} {a.name}</option>)}
        </select>

        <select className="input w-auto text-sm py-2"
          value={filters.vestibular ?? ''}
          onChange={e => e.target.value ? updateFilter('vestibular', e.target.value) : clearFilter('vestibular')}>
          <option value="">Todos os vestibulares</option>
          {vestibulares.map(v => <option key={v.id} value={v.slug}>{v.name}</option>)}
        </select>

        <select className="input w-auto text-sm py-2"
          value={filters.ano ?? ''}
          onChange={e => e.target.value ? updateFilter('ano', e.target.value) : clearFilter('ano')}>
          <option value="">Todos os anos</option>
          {Array.from({ length: 2024 - 2011 + 1 }, (_, i) => 2024 - i).map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {(filters.area || filters.vestibular || filters.ano) && (
          <button onClick={() => router.push('/questoes')}
            className="text-xs text-[var(--text-muted)] hover:text-white transition-colors px-3 py-2 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            ✕ Limpar filtros
          </button>
        )}
      </div>

      {/* Lista */}
      {questions.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-white font-bold mb-2">Nenhuma questão encontrada</h3>
          <p className="text-[var(--text-secondary)] text-sm">Tente ajustar os filtros acima</p>
        </div>
      ) : (
        <div className="space-y-6 stagger-in">
          {questions.map(q => (
            <QuestionCard key={q.id} question={q} userAnswer={answersMap[q.id]} onAnswer={handleAnswer} />
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button onClick={() => updateFilter('page', String(page - 1))} disabled={page <= 1}
            className="btn-ghost p-2 disabled:opacity-30">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-[var(--text-secondary)] px-4">
            Página {page} de {totalPages}
          </span>
          <button onClick={() => updateFilter('page', String(page + 1))} disabled={page >= totalPages}
            className="btn-ghost p-2 disabled:opacity-30">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}