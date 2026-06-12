// src/app/enem-do-emman/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import EnemDoEmmanClient from './EnemDoEmmanClient'

type UserAnswer = {
  question_id: string
  resposta: string
  correta: boolean
}

export default async function EnemDoEmmanPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // Busca a prova da semana atual
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

  // Provas anteriores
  const { data: pastExams } = await supabase
    .from('weekly_exams')
    .select('id, titulo, semana_inicio, semana_fim')
    .eq('publicada', true)
    .lt('semana_fim', today.toISOString().split('T')[0])
    .order('semana_inicio', { ascending: false })
    .limit(8)

  // Respostas do usuário nesta prova
type UserAnswer = {
  question_id: string
  resposta: 'A' | 'B' | 'C' | 'D' | 'E'
  correta: boolean
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