'use client'
// src/app/enem-do-emman/EnemDoEmmanClient.tsx
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trophy, CheckCircle, XCircle, BookOpen, Calendar, ImageOff } from 'lucide-react'

interface Props {
  exam: Record<string, unknown> | null
  pastExams: Record<string, unknown>[]
  userAnswers: { question_id: string; resposta: string; correta: boolean }[]
  userId: string
}

// Extrai imagens do texto em markdown
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
    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] p-3 rounded-xl mb-3"
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

export default function EnemDoEmmanClient({ exam, pastExams, userAnswers, userId }: Props) {
  const supabase = createClient()
  const [caderno, setCaderno] = useState<'humanas' | 'exatas'>('humanas')
  const [answers, setAnswers] = useState<Record<string, { resposta: string; correta: boolean }>>(
    Object.fromEntries(userAnswers.map(a => [a.question_id, { resposta: a.resposta, correta: a.correta }]))
  )
  const [revealed, setRevealed] = useState<Record<string, boolean>>(
    Object.fromEntries(userAnswers.map(a => [a.question_id, true]))
  )

  if (!exam) return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl" style={{ background: 'rgba(251,191,36,0.12)' }}>
          <Trophy size={24} className="text-[#fbbf24]" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Enem do Emman</h1>
          <p className="text-[var(--text-secondary)] text-sm">Prova semanal</p>
        </div>
      </div>
      <div className="card p-16 text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h3 className="text-white font-bold text-xl mb-2">Nenhuma prova essa semana ainda</h3>
        <p className="text-[var(--text-secondary)] text-sm">A prova é publicada toda segunda-feira.</p>
      </div>
      {pastExams.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Edições anteriores</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {pastExams.map(e => (
              <div key={e.id as string} className="card-hover p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl" style={{ background: 'rgba(92,92,255,0.1)' }}>
                  <Calendar size={20} className="text-[#a3a3ff]" />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">{e.titulo as string}</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {new Date(e.semana_inicio as string).toLocaleDateString('pt-BR')} – {new Date(e.semana_fim as string).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const weeklyQuestions = (exam.weekly_exam_questions as Record<string, unknown>[]) ?? []
  const questoesCaderno = weeklyQuestions
    .filter(wq => wq.caderno === caderno)
    .sort((a, b) => (a.ordem as number) - (b.ordem as number))

  const totalCaderno = questoesCaderno.length
  const respondidas = questoesCaderno.filter(wq => answers[wq.question_id as string]).length
  const corretas = questoesCaderno.filter(wq => answers[wq.question_id as string]?.correta).length
  const progresso = totalCaderno > 0 ? Math.round((respondidas / totalCaderno) * 100) : 0

  async function handleAnswer(questionId: string, resposta: string, gabarito: string) {
    const correta = resposta === gabarito
    setAnswers(prev => ({ ...prev, [questionId]: { resposta, correta } }))
    setRevealed(prev => ({ ...prev, [questionId]: true }))
    await supabase.from('user_answers').upsert({
      user_id: userId, question_id: questionId,
      exam_id: exam!.id as string, resposta, correta,
    }, { onConflict: 'user_id,question_id,exam_id' })
  }

  return (
    <div className="space-y-6">
      {/* Header da prova */}
      <div className="card p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]"
          style={{ background: 'radial-gradient(ellipse at 30% 50%, #fbbf24, transparent 60%)' }} />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl flex-shrink-0" style={{ background: 'rgba(251,191,36,0.15)' }}>
              <Trophy size={28} className="text-[#fbbf24]" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-[#fbbf24] mb-1">Esta semana</div>
              <h1 className="text-2xl font-black text-white">{exam.titulo as string}</h1>
              <p className="text-[var(--text-secondary)] text-sm">
                {new Date(exam.semana_inicio as string).toLocaleDateString('pt-BR')} – {new Date(exam.semana_fim as string).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {[
              { value: `${respondidas}/${totalCaderno}`, label: 'Respondidas' },
              { value: corretas, label: 'Corretas', color: '#22c55e' },
              { value: `${respondidas > 0 ? Math.round((corretas / respondidas) * 100) : 0}%`, label: 'Acerto', gradient: true },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className={`text-2xl font-black ${s.gradient ? 'text-gradient' : ''}`}
                  style={s.color ? { color: s.color } : {}}>
                  {s.value}
                </div>
                <div className="text-xs text-[var(--text-muted)]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Barra de progresso */}
        <div className="relative mt-4 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progresso}%`, background: 'linear-gradient(90deg, #5c5cff, #a855f7)' }} />
        </div>
        <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
          <span>{progresso}% concluído</span>
          <span>{totalCaderno - respondidas} restantes neste caderno</span>
        </div>
      </div>

      {/* Seletor de caderno */}
      <div className="flex gap-2 p-1 rounded-xl w-fit"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {(['humanas', 'exatas'] as const).map(c => (
          <button key={c} onClick={() => setCaderno(c)}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
            style={caderno === c ? {
              background: 'linear-gradient(135deg, #5c5cff, #a855f7)',
              color: 'white', boxShadow: '0 2px 12px rgba(92,92,255,0.3)'
            } : { color: 'var(--text-muted)' }}>
            {c === 'humanas' ? '🏛️ Ciências Humanas' : '🔬 Ciências Exatas'}
          </button>
        ))}
      </div>

      {/* Questões */}
      <div className="space-y-5 stagger-in">
        {questoesCaderno.map((wq, idx) => {
          const q = wq.questions as Record<string, unknown>
          if (!q) return null
          const area = q.areas as Record<string, unknown> | undefined
          const vestibular = q.vestibulares as Record<string, unknown> | undefined
          const areaColor = (area?.color as string) ?? '#5c5cff'
          const ans = answers[q.id as string]
          const isRevealed = revealed[q.id as string]
          const acertou = ans?.correta
          const gabarito = q.gabarito as string
          const alternativas = q.alternativas as { letra: string; texto: string }[]

          const { textoLimpo: contextoLimpo, urls: urlsContexto } = extrairImagens(q.contexto as string)
          const { textoLimpo: enunciadoLimpo, urls: urlsEnunciado } = extrairImagens(q.enunciado as string)
          const todasUrls = [...urlsContexto, ...urlsEnunciado, ...(q.imagem_url ? [q.imagem_url as string] : [])]
            .filter((u, i, a) => a.indexOf(u) === i)

          function getAltClass(letra: string) {
            if (!isRevealed) return ans?.resposta === letra ? 'selected' : ''
            if (letra === gabarito) return 'correct'
            if (letra === ans?.resposta && letra !== gabarito) return 'wrong'
            return ''
          }

          return (
            <div key={wq.id as string} className="card overflow-hidden">
              {/* Header da questão */}
              <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3"
                style={{ background: `linear-gradient(135deg, ${areaColor}18, transparent)`, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl font-black text-sm text-white flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${areaColor}, ${areaColor}99)` }}>
                    {idx + 1}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">{vestibular?.name as string ?? 'ENEM'}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md"
                        style={{ background: 'rgba(92,92,255,0.15)', color: '#a3a3ff' }}>
                        {q.ano as number}
                      </span>
                    </div>
                    {area && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{area.icon as string}</span>
                        <span className="text-xs font-semibold" style={{ color: areaColor }}>
                          {area.name as string}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge text-xs" style={{
                    background: 'rgba(251,191,36,0.1)', color: '#fde68a', border: '1px solid rgba(251,191,36,0.2)'
                  }}>Médio</span>
                  {isRevealed && (
                    <span className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: acertou ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.1)' }}>
                      {acertou ? <CheckCircle size={13} className="text-[#22c55e]" /> : <XCircle size={13} className="text-[#ef4444]" />}
                    </span>
                  )}
                </div>
              </div>

              {/* Corpo */}
              <div className="p-6 md:p-8">
                {contextoLimpo && (
                  <div className="p-4 rounded-2xl mb-5 text-sm text-[var(--text-secondary)] leading-relaxed"
                    style={{ background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${areaColor}88` }}>
                    {contextoLimpo}
                  </div>
                )}

                {todasUrls.length > 0 && (
                  <div className="mb-5">
                    {todasUrls.map((url, i) => <QuestionImage key={i} url={url} />)}
                  </div>
                )}

                <p className="text-white text-[15px] leading-relaxed mb-6 font-medium">
                  {enunciadoLimpo || (q.enunciado as string)}
                </p>

                <div className="space-y-2.5">
                  {(alternativas ?? []).map((alt) => (
                    <button key={alt.letra}
                      onClick={() => !isRevealed && handleAnswer(q.id as string, alt.letra, gabarito)}
                      disabled={isRevealed}
                      className={`alt-option w-full text-left ${getAltClass(alt.letra)}`}>
                      <span className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black"
                        style={{ background: 'rgba(92,92,255,0.12)', color: '#a3a3ff', minWidth: 32 }}>
                        {alt.letra}
                      </span>
                      <span className="text-sm text-[var(--text-secondary)] flex-1 leading-relaxed text-left">
                        {alt.texto}
                      </span>
                      {isRevealed && alt.letra === gabarito && <CheckCircle size={15} className="text-[#22c55e] flex-shrink-0" />}
                      {isRevealed && alt.letra === ans?.resposta && alt.letra !== gabarito && <XCircle size={15} className="text-[#ef4444] flex-shrink-0" />}
                    </button>
                  ))}
                </div>

                {isRevealed && (
                  <div className="mt-5 p-4 rounded-2xl text-sm animate-[slideUp_0.3s_ease-out]" style={{
                    background: acertou ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.04)',
                    border: `1px solid ${acertou ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.12)'}`
                  }}>
                    <div className="flex items-center gap-2 font-bold mb-2 text-sm"
                      style={{ color: acertou ? '#86efac' : '#fca5a5' }}>
                      {acertou
                        ? <><CheckCircle size={14} /> Correto! Gabarito: {gabarito}</>
                        : <><XCircle size={14} /> Incorreto. Gabarito: {gabarito}</>}
                    </div>
                    {q.explicacao ? (
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-1.5">
                          <BookOpen size={11} /> Resolução
                        </div>
                        <p className="text-[var(--text-secondary)] text-[13px] leading-relaxed">{q.explicacao as string}</p>
                      </div>
                    ) : (
                      <p className="text-[var(--text-muted)] text-xs italic">Resolução ainda não disponível.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}