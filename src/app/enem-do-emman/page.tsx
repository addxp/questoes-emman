// src/app/enem-do-emman/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import EnemDoEmmanClient from './EnemDoEmmanClient'
import type { Profile } from '@/types'

export default async function EnemDoEmmanPage() {
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

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const { data: exam } = await supabase
    .from('weekly_exams')
    .select('*, weekly_exam_questions(*, questions(*, areas(*), vestibulares(*)))')
    .eq('publicada', true)
    .gte('semana_fim', todayStr)
    .lte('semana_inicio', todayStr)
    .single()

  const { data: pastExams } = await supabase
    .from('weekly_exams')
    .select('id, titulo, semana_inicio, semana_fim')
    .eq('publicada', true)
    .lt('semana_fim', todayStr)
    .order('semana_inicio', { ascending: false })
    .limit(8)

  let userAnswers: { question_id: string; resposta: string; correta: boolean }[] = []
  if (exam) {
    const { data } = await supabase
      .from('user_answers')
      .select('question_id, resposta, correta')
      .eq('user_id', user.id)
      .eq('exam_id', exam.id)
    userAnswers = (data ?? []) as typeof userAnswers
  }

  return (
    <AppLayout profile={safeProfile}>
      <EnemDoEmmanClient
        exam={exam ?? null}
        pastExams={pastExams ?? []}
        userAnswers={userAnswers}
        userId={user.id}
      />
    </AppLayout>
  )
}