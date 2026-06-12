// src/app/enem-do-emman/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import EnemDoEmmanClient from './EnemDoEmmanClient'

export default async function EnemDoEmmanPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const today = new Date()

  const { data: exam } = await supabase
    .from('weekly_exams')
    .select(`
      *,
      weekly_exam_questions (
        *,
        questions (*, areas(*), vestibulares(*))
      )
    `)
    .eq('publicada', true)
    .gte('semana_fim', today.toISOString().split('T')[0])
    .lte('semana_inicio', today.toISOString().split('T')[0])
    .single()

  const { data: pastExams } = await supabase
    .from('weekly_exams')
    .select('id, titulo, semana_inicio, semana_fim')
    .eq('publicada', true)
    .lt('semana_fim', today.toISOString().split('T')[0])
    .order('semana_inicio', { ascending: false })
    .limit(8)

  let userAnswers: { question_id: string; resposta: string | null; correta: boolean | null }[] = []
  if (exam) {
    const { data } = await supabase
      .from('user_answers')
      .select('question_id, resposta, correta')
      .eq('user_id', user.id)
      .eq('exam_id', exam.id)
    userAnswers = data || []
  }

  return (
    <AppLayout profile={profile}>
      <EnemDoEmmanClient
        exam={exam || null}
        pastExams={pastExams || []}
        userAnswers={userAnswers}
        userId={user.id}
      />
    </AppLayout>
  )
}