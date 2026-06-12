// src/app/perfil/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { BarChart2, CheckCircle, BookOpen, Clock, Zap } from 'lucide-react'
import type { Profile } from '@/types'

interface AreaStat {
  name: string
  icon: string
  color: string
  total: number
  corretas: number
}

export default async function PerfilPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  let safeProfile: Profile | null = profile
  if (!safeProfile) {
    const { data: newProfile } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name ?? user.email!.split('@')[0],
        role: 'user',
      })
      .select()
      .single()
    safeProfile = newProfile
  }

  const { data: statsRaw } = await supabase
    .from('user_stats').select('*').eq('user_id', user.id).single()

  // Busca respostas com área — duas queries separadas para evitar problema de tipo
  const { data: answers } = await supabase
    .from('user_answers')
    .select('question_id, correta')
    .eq('user_id', user.id)

  const areaMap: Record<string, AreaStat> = {}

  if (answers && answers.length > 0) {
    const questionIds = answers.map((a) => a.question_id as string)
    const { data: questionsWithArea } = await supabase
      .from('questions')
      .select('id, areas(name, icon, color, slug)')
      .in('id', questionIds)

    const areaByQuestion: Record<string, { name: string; icon: string; color: string; slug: string }> = {}
    for (const q of questionsWithArea ?? []) {
      const area = Array.isArray(q.areas) ? q.areas[0] : q.areas
      if (area && typeof area === 'object' && 'slug' in area) {
        areaByQuestion[q.id as string] = area as { name: string; icon: string; color: string; slug: string }
      }
    }

    for (const ans of answers) {
      const area = areaByQuestion[ans.question_id as string]
      if (!area) continue
      if (!areaMap[area.slug]) {
        areaMap[area.slug] = { name: area.name, icon: area.icon, color: area.color, total: 0, corretas: 0 }
      }
      areaMap[area.slug].total++
      if (ans.correta) areaMap[area.slug].corretas++
    }
  }

  const areaStats = Object.values(areaMap).sort((a, b) => b.total - a.total)
  const stats = statsRaw ?? { total_respondidas: 0, total_corretas: 0, pct_acerto: 0, tempo_medio_seg: 0 }

  const userName = safeProfile?.name ?? safeProfile?.email?.split('@')[0] ?? 'Estudante'
  const userEmail = safeProfile?.email ?? user.email ?? ''
  const userInitial = userName[0]?.toUpperCase() ?? 'U'
  const createdAt = safeProfile?.created_at ?? user.created_at

  return (
    <AppLayout profile={safeProfile}>
      <div className="space-y-6">
        <div className="card p-6 flex flex-col md:flex-row items-center gap-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #5c5cff, #a855f7)', boxShadow: '0 0 32px rgba(92,92,255,0.4)' }}
          >
            {userInitial}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-black text-white">{userName}</h1>
            <p className="text-[var(--text-secondary)] text-sm">{userEmail}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Membro desde {createdAt ? new Date(createdAt).toLocaleDateString('pt-BR') : '—'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: BookOpen,    label: 'Respondidas', value: stats.total_respondidas,          color: '#5c5cff' },
            { icon: CheckCircle, label: 'Corretas',    value: stats.total_corretas,             color: '#22c55e' },
            { icon: Zap,         label: '% Acerto',    value: `${stats.pct_acerto ?? 0}%`,      color: '#a855f7' },
            { icon: Clock,       label: 'Tempo médio', value: stats.tempo_medio_seg
                ? `${Math.round(stats.tempo_medio_seg as number)}s` : '—',                       color: '#fbbf24' },
          ].map((s) => (
            <div key={s.label} className="card p-5">
              <div className="flex justify-between items-center mb-3">
                <s.icon size={18} style={{ color: s.color }} />
                <span className="text-xs text-[var(--text-muted)]">{s.label}</span>
              </div>
              <div className="text-2xl font-black text-white">{s.value ?? 0}</div>
            </div>
          ))}
        </div>

        {areaStats.length > 0 ? (
          <div className="card p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <BarChart2 size={18} className="text-[var(--text-muted)]" />
              Desempenho por Disciplina
            </h2>
            <div className="space-y-4">
              {areaStats.map((a) => {
                const pct = a.total > 0 ? Math.round((a.corretas / a.total) * 100) : 0
                return (
                  <div key={a.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        <span>{a.icon}</span>
                        <span className="text-white font-medium">{a.name}</span>
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {a.corretas}/{a.total}{' '}·{' '}
                        <span className="font-semibold" style={{ color: a.color }}>{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: a.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="card p-16 text-center">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-white font-bold mb-2">Nenhuma questão respondida ainda</h3>
            <p className="text-[var(--text-secondary)] text-sm">Comece a praticar para ver seu desempenho aqui!</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}