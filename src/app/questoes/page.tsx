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

  // Busca perfil — pode ser null se o trigger não rodou ainda
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Se não tem perfil, cria um na hora
  let safeProfile = profile
  if (!safeProfile) {
    const { data: newProfile } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || user.email!.split('@')[0],
        role: 'user',
      })
      .select()
      .single()
    safeProfile = newProfile
  }

  const { data: areas } = await supabase.from('areas').select('*').order('name')
  const { data: vestibulares } = await supabase.from('vestibulares').select('*').order('name')

  let query = supabase
    .from('questions')
    .select(`*, areas(*), vestibulares(*)`, { count: 'exact' })
    .eq('ativo', true)

  const page = parseInt(searchParams.page || '1')
  const pageSize = 10

  if (searchParams.ano) query = query.eq('ano', parseInt(searchParams.ano))

  const { data: questions, count } = await query
    .order('ano', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  const questionIds = (questions || []).map(q => q.id)
  let userAnswers: any[] = []
  if (questionIds.length > 0) {
    const { data } = await supabase
      .from('user_answers')
      .select('question_id, resposta, correta')
      .eq('user_id', user.id)
      .in('question_id', questionIds)
    userAnswers = data || []
  }

  return (
    <AppLayout profile={safeProfile}>
      <QuestoesClient
        questions={questions || []}
        areas={areas || []}
        vestibulares={vestibulares || []}
        userAnswers={userAnswers}
        total={count || 0}
        page={page}
        pageSize={pageSize}
        filters={searchParams}
      />
    </AppLayout>
  )
}