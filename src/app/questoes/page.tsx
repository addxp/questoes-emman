// src/app/questoes/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import QuestoesClient from './QuestoesClient'

export default async function QuestoesPage({
  searchParams
}: {
  searchParams: { area?: string; vestibular?: string; ano?: string; page?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  // Busca filtros
  const { data: areas } = await supabase.from('areas').select('*').order('name')
  const { data: vestibulares } = await supabase.from('vestibulares').select('*').order('name')

  // Query de questões com filtros
  let query = supabase
    .from('questions')
    .select(`*, areas(*), vestibulares(*)`, { count: 'exact' })
    .eq('ativo', true)

  if (searchParams.area) query = query.eq('areas.slug', searchParams.area)
  if (searchParams.vestibular) query = query.eq('vestibulares.slug', searchParams.vestibular)
  if (searchParams.ano) query = query.eq('ano', parseInt(searchParams.ano))

  const page = parseInt(searchParams.page || '1')
  const pageSize = 10
  query = query
    .order('ano', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  const { data: questions, count } = await query

  // Respostas do usuário (para marcar questões já respondidas)
  const questionIds = (questions || []).map(q => q.id)
  const { data: userAnswers } = await supabase
    .from('user_answers')
    .select('question_id, resposta, correta')
    .eq('user_id', user.id)
    .in('question_id', questionIds)

  return (
    <AppLayout profile={profile}>
      <QuestoesClient
        questions={questions || []}
        areas={areas || []}
        vestibulares={vestibulares || []}
        userAnswers={userAnswers || []}
        total={count || 0}
        page={page}
        pageSize={pageSize}
        filters={searchParams}
      />
    </AppLayout>
  )
}