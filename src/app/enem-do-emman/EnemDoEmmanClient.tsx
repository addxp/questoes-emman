'use client'
// src/app/enem-do-emman/EnemDoEmmanClient.tsx
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trophy, CheckCircle, XCircle, BookOpen, Calendar } from 'lucide-react'
import type { UserAnswer } from '@/types'

interface Alternativa {
  letra: string
  texto: string
  correta: boolean
}

interface Area {
  name: string
  icon: string
  color: string
}

interface Vestibular {
  name: string
}

interface Question {
  id: string
  enunciado: string
  contexto?: string
  gabarito: string
  ano: number
  explicacao?: string
  alternativas: Alternativa[]
  areas?: Area
  vestibulares?: Vestibular
}

interface WeeklyExamQuestion {
  id: string
  caderno: 'humanas' | 'exatas'
  ordem: number
  question_id: string
  questions: Question
}

interface Exam {
  id: string
  titulo: string
  semana_inicio: string
  semana_fim: string
  weekly_exam_questions: WeeklyExamQuestion[]
}

interface PastExam {
  id: string
  titulo: string
  semana_inicio: string
  semana_fim: string
}

interface Props {
  exam: Exam | null
  pastExams: PastExam[]
  userAnswers: UserAnswer[]
  userId: string
}

export default function EnemDoEmmanClient({ exam, pastExams, userAnswers, userId }: Props) {
  const supabase = createClient()
  const [caderno, setCaderno] = useState<'humanas' | 'exatas'>('humanas')
  const [answers, setAnswers] = useState<Record<string, { resposta: string; correta: boolean }>>(
    Object.fromEntries(userAnswers.map(a => [a.question_id, { resposta: a.resposta, correta: a.correta }]))
  )
  const [revealed, setRevealed] = useState<Record<string, boolean>>(
    Object.fromEntries(userAnswers.map(a => [a.question_id, true]))
  )

  if (!exam) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl" style={{ background: 'rgba(251,191,36,0.12)' }}>
            <Trophy size={24} className="text-[#fbbf24]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Enem do Emman</h1>
            <p className="text-[var(--text-secondary)] text-sm">Prova semanal de preparação</p>
          </div>
        </div>

        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h3 className="text-white font-bold text-xl mb-2">Nenhuma prova essa semana ainda</h3>
          <p className="text-[var(--text-secondary)]">A prova é publicada toda segunda-feira. Volte em breve!</p>
        </div>

        {pastExams.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Edições anteriores</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {pastExams.map(e => (
                <div key={e.id} className="card-hover p-5 flex items-center gap-4">
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(92,92,255,0.1)' }}>
                    <Calendar size={20} className="text-[#a3a3ff]" />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">{e.titulo}</div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {new Date(e.semana_inicio).toLocaleDateString('pt-BR')} – {new Date(e.semana_fim).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const questoesCaderno = (exam.weekly_exam_questions || [])
    .filter(wq => wq.caderno === caderno)
    .sort((a, b) => a.ordem - b.ordem)

  const totalCaderno = questoesCaderno.length
  const respondidas = questoesCaderno.filter(wq => answers[wq.question_id]).length
  const corretas = questoesCaderno.filter(wq => answers[wq.question_id]?.correta).length
  const progresso = totalCaderno > 0 ? Math.round(respondidas / totalCaderno * 100) : 0

  async function handleAnswer(questionId: string, resposta: string, gabarito: string) {
    if (!exam) return
    const correta = resposta === gabarito
    setAnswers(prev => ({ ...prev, [questionId]: { resposta, correta } }))
    setRevealed(prev => ({ ...prev, [questionId]: true }))
    await supabase.from('user_answers').upsert({
      user_id: userId,
      question_id: questionId,
      exam_id: exam.id,
      resposta,
      correta,
    }, { onConflict: 'user_id,question_id,exam_id' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]"
          style={{ background: 'radial-gradient(ellipse at 30% 50%, #fbbf24, transparent 60%)' }} />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(251,191,36,0.15)' }}>
              <Trophy size={28} className="text-[#fbbf24]" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-[#fbbf24] mb-1">Esta semana</div>
              <h1 className="text-2xl font-black text-white">{exam.titulo}</h1>
              <p className="text-[var(--text-secondary)] text-sm">
                {new Date(exam.semana_inicio).toLocaleDateString('pt-BR')} – {new Date(exam.semana_fim).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-black text-white">{respondidas}/{totalCaderno}</div>
              <div className="text-xs text-[var(--text-muted)]">Respondidas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-[#22c55e]">{corretas}</div>
              <div className="text-xs text-[var(--text-muted)]">Corretas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-gradient">{respondidas > 0 ? Math.round(corretas/respondidas*100) : 0}%</div>
              <div className="text-xs text-[var(--text-muted)]">Acerto</div>
            </div>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="relative mt-4 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progresso}%`,
              background: 'linear-gradient(90deg, #5c5cff, #a855f7)',
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
          <span>{progresso}% concluído</span>
          <span>{totalCaderno - respondidas} restantes</span>
        </div>
      </div>

      {/* Seletor de caderno */}
      <div className="flex gap-2 p-1 rounded-xl w-fit"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {(['humanas', 'exatas'] as const).map(c => (
          <button key={c}
            onClick={() => setCaderno(c)}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              caderno === c
                ? 'text-white'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
            style={caderno === c ? {
              background: 'linear-gradient(135deg, #5c5cff, #a855f7)',
              boxShadow: '0 2px 12px rgba(92,92,255,0.3)'
            } : {}}>
            {c === 'humanas' ? '🏛️ Ciências Humanas' : '🔬 Ciências Exatas'}
          </button>
        ))}
      </div>

      {/* Questões */}
      <div className="space-y-6 stagger-in">
        {questoesCaderno.map((wq, idx) => {
          const q = wq.questions
          const ans = answers[q.id]
          const isRevealed = revealed[q.id]

          return (
            <div key={wq.id} className="card p-6 md:p-8">
              {/* Header */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs font-black text-[var(--text-muted)]">
                  Questão {idx + 1}
                </span>
                <span className="badge"
                  style={{ background: q.areas?.color + '22', color: q.areas?.color, border: `1px solid ${q.areas?.color}44` }}>
                  {q.areas?.icon} {q.areas?.name}
                </span>
                <span className="badge"
                  style={{ background: 'rgba(92,92,255,0.12)', color: '#a3a3ff', border: '1px solid rgba(92,92,255,0.2)' }}>
                  {q.vestibulares?.name} {q.ano}
                </span>
                {isRevealed && (
                  <span className="ml-auto">
                    {ans?.correta
                      ? <CheckCircle size={18} className="text-[#22c55e]" />
                      : <XCircle size={18} className="text-[#ef4444]" />}
                  </span>
                )}
              </div>

              {q.contexto && (
                <div className="p-4 rounded-xl mb-4 text-sm text-[var(--text-secondary)] leading-relaxed"
                  style={{ background: 'rgba(255,255,255,0.03)', borderLeft: '2px solid rgba(92,92,255,0.4)' }}>
                  {q.contexto}
                </div>
              )}

              <p className="text-white leading-relaxed mb-6">{q.enunciado}</p>

              <div className="space-y-2">
                {q.alternativas?.map((alt) => {
                  let cls = ''
                  if (isRevealed) {
                    if (alt.letra === q.gabarito) cls = 'correct'
                    else if (alt.letra === ans?.resposta) cls = 'wrong'
                  } else if (alt.letra === ans?.resposta) {
                    cls = 'selected'
                  }
                  return (
                    <button key={alt.letra}
                      onClick={() => !isRevealed && handleAnswer(q.id, alt.letra, q.gabarito)}
                      className={`alt-option w-full text-left ${cls}`}
                      disabled={isRevealed}>
                      <span className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ background: 'rgba(92,92,255,0.15)', color: '#a3a3ff' }}>
                        {alt.letra}
                      </span>
                      <span className="text-sm text-[var(--text-secondary)] flex-1 leading-relaxed">{alt.texto}</span>
                      {isRevealed && alt.letra === q.gabarito && <CheckCircle size={15} className="text-[#22c55e] flex-shrink-0" />}
                      {isRevealed && alt.letra === ans?.resposta && alt.letra !== q.gabarito && <XCircle size={15} className="text-[#ef4444] flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>

              {isRevealed && q.explicacao && (
                <div className="mt-5 p-4 rounded-xl text-sm animate-[slideUp_0.3s_ease-out]"
                  style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <div className="font-semibold text-[#86efac] mb-2 flex items-center gap-2">
                    <BookOpen size={13} /> Resolução
                  </div>
                  <p className="text-[var(--text-secondary)] leading-relaxed">{q.explicacao}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}