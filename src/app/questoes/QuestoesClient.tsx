'use client'
// src/app/questoes/QuestoesClient.tsx
import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Question, Area, Vestibular, UserAnswer } from '@/types'
import { Filter, ChevronLeft, ChevronRight, CheckCircle, XCircle, BookOpen, Clock } from 'lucide-react'

interface Props {
  questions: Question[]
  areas: Area[]
  vestibulares: Vestibular[]
  userAnswers: Partial<UserAnswer>[]
  total: number
  page: number
  pageSize: number
  filters: Record<string, string | undefined>
}

function QuestionCard({
  question,
  userAnswer,
  onAnswer,
}: {
  question: Question
  userAnswer?: Partial<UserAnswer>
  onAnswer: (questionId: string, resposta: string) => void
}) {
  const [selected, setSelected] = useState<string | null>(userAnswer?.resposta || null)
  const [revealed, setRevealed] = useState(!!userAnswer?.resposta)
  const [startTime] = useState(Date.now())

  const letras = ['A', 'B', 'C', 'D', 'E'] as const

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
      {/* Header da questão */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="badge"
          style={{ background: (question.areas as any)?.color + '22', color: (question.areas as any)?.color, border: `1px solid ${(question.areas as any)?.color}44` }}>
          {(question.areas as any)?.icon} {(question.areas as any)?.name}
        </span>
        <span className="badge"
          style={{ background: 'rgba(92,92,255,0.12)', color: '#a3a3ff', border: '1px solid rgba(92,92,255,0.2)' }}>
          {(question.vestibulares as any)?.name} {question.ano}
        </span>
        {question.numero && (
          <span className="badge"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.07)' }}>
            Q{question.numero}
          </span>
        )}
        <span className="badge ml-auto"
          style={{
            background: question.dificuldade === 'facil' ? 'rgba(34,197,94,0.12)' :
              question.dificuldade === 'dificil' ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.1)',
            color: question.dificuldade === 'facil' ? '#86efac' :
              question.dificuldade === 'dificil' ? '#fca5a5' : '#fde68a',
            border: `1px solid ${question.dificuldade === 'facil' ? 'rgba(34,197,94,0.25)' :
              question.dificuldade === 'dificil' ? 'rgba(239,68,68,0.2)' : 'rgba(251,191,36,0.2)'}`
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
      {question.imagem_url && (
        <div className="mb-4 rounded-xl overflow-hidden">
          <img src={question.imagem_url} alt="Imagem da questão" className="max-w-full h-auto" />
        </div>
      )}

      {/* Enunciado */}
      <p className="text-white text-base leading-relaxed mb-6">{question.enunciado}</p>

      {/* Alternativas */}
      <div className="space-y-2">
        {question.alternativas.map((alt) => (
          <button
            key={alt.letra}
            onClick={() => handleAnswer(alt.letra)}
            className={`alt-option w-full text-left ${getAltClass(alt.letra)}`}
            disabled={revealed}
          >
            <span className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: 'rgba(92,92,255,0.15)', color: '#a3a3ff' }}>
              {alt.letra}
            </span>
            <span className="text-sm text-[var(--text-secondary)] flex-1 leading-relaxed">{alt.texto}</span>
            {revealed && alt.letra === question.gabarito && (
              <CheckCircle size={16} className="text-[#22c55e] flex-shrink-0" />
            )}
            {revealed && alt.letra === selected && alt.letra !== question.gabarito && (
              <XCircle size={16} className="text-[#ef4444] flex-shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Explicação */}
      {revealed && question.explicacao && (
        <div className="mt-6 p-4 rounded-xl text-sm leading-relaxed animate-[slideUp_0.3s_ease-out]"
          style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <div className="font-semibold text-[#86efac] mb-2 flex items-center gap-2">
            <BookOpen size={14} /> Resolução
          </div>
          <p className="text-[var(--text-secondary)]">{question.explicacao}</p>
        </div>
      )}
    </div>
  )
}

export default function QuestoesClient({ questions, areas, vestibulares, userAnswers, total, page, pageSize, filters }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const totalPages = Math.ceil(total / pageSize)

  const answersMap = Object.fromEntries(userAnswers.map(a => [a.question_id!, a]))

  async function handleAnswer(questionId: string, resposta: string) {
    const question = questions.find(q => q.id === questionId)
    if (!question) return
    const correta = resposta === question.gabarito
    await supabase.from('user_answers').upsert({
      question_id: questionId,
      resposta,
      correta,
      exam_id: null,
    }, { onConflict: 'user_id,question_id,exam_id' })
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Banco de Questões</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">{total.toLocaleString()} questões disponíveis</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <Filter size={14} className="text-[var(--text-muted)]" />
        <select className="input w-auto text-sm py-2"
          value={filters.area || ''}
          onChange={e => e.target.value ? updateFilter('area', e.target.value) : clearFilter('area')}>
          <option value="">Todas as disciplinas</option>
          {areas.map(a => <option key={a.id} value={a.slug}>{a.icon} {a.name}</option>)}
        </select>
        <select className="input w-auto text-sm py-2"
          value={filters.vestibular || ''}
          onChange={e => e.target.value ? updateFilter('vestibular', e.target.value) : clearFilter('vestibular')}>
          <option value="">Todos os vestibulares</option>
          {vestibulares.map(v => <option key={v.id} value={v.slug}>{v.name}</option>)}
        </select>
        <select className="input w-auto text-sm py-2"
          value={filters.ano || ''}
          onChange={e => e.target.value ? updateFilter('ano', e.target.value) : clearFilter('ano')}>
          <option value="">Todos os anos</option>
          {Array.from({ length: 2024 - 2011 + 1 }, (_, i) => 2024 - i).map(y =>
            <option key={y} value={y}>{y}</option>
          )}
        </select>
      </div>

      {/* Lista de questões */}
      {questions.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-white font-bold mb-2">Nenhuma questão encontrada</h3>
          <p className="text-[var(--text-secondary)] text-sm">Tente ajustar os filtros acima</p>
        </div>
      ) : (
        <div className="space-y-6 stagger-in">
          {questions.map(q => (
            <QuestionCard
              key={q.id}
              question={q}
              userAnswer={answersMap[q.id]}
              onAnswer={handleAnswer}
            />
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => updateFilter('page', String(page - 1))}
            disabled={page <= 1}
            className="btn-ghost p-2 disabled:opacity-30">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-[var(--text-secondary)] px-4">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => updateFilter('page', String(page + 1))}
            disabled={page >= totalPages}
            className="btn-ghost p-2 disabled:opacity-30">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}