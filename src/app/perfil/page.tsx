// src/app/perfil/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { BarChart2, CheckCircle, BookOpen, Clock, Zap } from 'lucide-react'

type AreaInfo = {
  name: string
  icon: string
  color: string
  slug: string
}

type AnswerWithArea = {
  correta: boolean
  questions: {
    area_id: string
    areas: AreaInfo | AreaInfo[] | null
  } | null
}

export default async function PerfilPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // Stats gerais
  const { data: statsRaw } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Desempenho por área
  const { data: byArea } = await supabase
    .from('user_answers')
    .select(`correta, questions!inner(area_id, areas!inner(name, icon, color, slug))`)
    .eq('user_id', user.id)

  // Agrupa por área
  const areaMap: Record<string, { name: string; icon: string; color: string; total: number; corretas: number }> = {}
  for (const ans of (byArea || []) as unknown as AnswerWithArea[]) {
    const areaData = ans.questions?.areas
    const area = Array.isArray(areaData) ? areaData[0] : areaData
    if (!area) continue
    if (!areaMap[area.slug]) areaMap[area.slug] = { name: area.name, icon: area.icon, color: area.color, total: 0, corretas: 0 }
    areaMap[area.slug].total++
    if (ans.correta) areaMap[area.slug].corretas++
  }
  const areaStats = Object.values(areaMap).sort((a, b) => b.total - a.total)

  const stats = statsRaw || { total_respondidas: 0, total_corretas: 0, pct_acerto: 0, tempo_medio_seg: 0 }

  return (
    <AppLayout profile={profile}>
      <div className="space-y-6">
        {/* Header */}
        <div className="card p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #5c5cff, #a855f7)', boxShadow: '0 0 32px rgba(92,92,255,0.4)' }}>
            {(profile.name || profile.email)?.[0]?.toUpperCase()}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-black text-white">{profile.name || 'Estudante'}</h1>
            <p className="text-[var(--text-secondary)] text-sm">{profile.email}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: BookOpen, label: 'Respondidas', value: stats.total_respondidas, color: '#5c5cff' },
            { icon: CheckCircle, label: 'Corretas', value: stats.total_corretas, color: '#22c55e' },
            { icon: Zap, label: '% Acerto', value: `${stats.pct_acerto || 0}%`, color: '#a855f7' },
            { icon: Clock, label: 'Tempo médio', value: stats.tempo_medio_seg ? `${Math.round(stats.tempo_medio_seg)}s` : '—', color: '#fbbf24' },
          ].map(s => (
            <div key={s.label} className="card p-5">
              <div className="flex justify-between items-center mb-3">
                <s.icon size={18} style={{ color: s.color }} />
                <span className="text-xs text-[var(--text-muted)]">{s.label}</span>
              </div>
              <div className="text-2xl font-black text-white">{s.value || 0}</div>
            </div>
          ))}
        </div>

        {/* Por disciplina */}
        {areaStats.length > 0 && (
          <div className="card p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <BarChart2 size={18} className="text-[var(--text-muted)]" />
              Desempenho por Disciplina
            </h2>
            <div className="space-y-4">
              {areaStats.map(a => {
                const pct = a.total > 0 ? Math.round(a.corretas / a.total * 100) : 0
                return (
                  <div key={a.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        <span>{a.icon}</span>
                        <span className="text-white font-medium">{a.name}</span>
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {a.corretas}/{a.total} · <span className="font-semibold" style={{ color: a.color }}>{pct}%</span>
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
        )}

        {areaStats.length === 0 && (
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