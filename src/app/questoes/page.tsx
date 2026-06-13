// src/app/questoes/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import QuestoesClient from './QuestoesClient'
import type { Profile } from '@/types'

export default async function QuestoesPage({
  searchParams,
}: {
  searchParams: { area?: string; vestibular?: string; ano?: string; page?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Busca ou cria perfil
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  let safeProfile: Profile | null = profile
  if (!safeProfile) {
    const { data: np } = await supabase.from('profiles').upsert({
      id: user.id, email: user.email!,
      name: user.user_metadata?.name ?? user.email!.split('@')[0], role: 'user',
    }).select().single()
    safeProfile = np
  }

  const { data: areas } = await supabase.from('areas').select('*').order('name')
  const { data: vestibulares } = await supabase.from('vestibulares').select('*').order('name')

  const page = parseInt(searchParams.page ?? '1')
  const pageSize = 10

  // Resolve IDs a partir dos slugs ANTES da query principal
  let areaId: number | null = null
  let vestibularId: number | null = null

  if (searchParams.area) {
    const found = (areas ?? []).find(a => a.slug === searchParams.area)
    areaId = found?.id ?? null
  }
  if (searchParams.vestibular) {
    const found = (vestibulares ?? []).find(v => v.slug === searchParams.vestibular)
    vestibularId = found?.id ?? null
  }

  // Query com filtros por ID direto (não por join)
  let query = supabase
    .from('questions')
    .select('*, areas(*), vestibulares(*)', { count: 'exact' })
    .eq('ativo', true)

  if (areaId !== null)       query = query.eq('area_id', areaId)
  if (vestibularId !== null) query = query.eq('vestibular_id', vestibularId)
  if (searchParams.ano)      query = query.eq('ano', parseInt(searchParams.ano))

  const { data: questions, count } = await query
    .order('ano', { ascending: false })
    .order('numero', { ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1)

  // Respostas do usuário para as questões da página
  const questionIds = (questions ?? []).map(q => q.id as string)
  let userAnswers: { question_id: string; resposta: string; correta: boolean }[] = []
  if (questionIds.length > 0) {
    const { data } = await supabase
      .from('user_answers')
      .select('question_id, resposta, correta')
      .eq('user_id', user.id)
      .in('question_id', questionIds)
    userAnswers = (data ?? []) as typeof userAnswers
  }

  return (
    <AppLayout profile={safeProfile}>
      <QuestoesClient
        questions={questions ?? []}
        areas={areas ?? []}
        vestibulares={vestibulares ?? []}
        userAnswers={userAnswers}
        total={count ?? 0}
        page={page}
        pageSize={pageSize}
        filters={searchParams}
      />
    </AppLayout>
  )
}