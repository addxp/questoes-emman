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

  const { data: areas } = await supabase.from('areas').select('*').order('name')
  const { data: vestibulares } = await supabase.from('vestibulares').select('*').order('name')

  const page = parseInt(searchParams.page ?? '1')
  const pageSize = 10

  // Resolve area_id e vestibular_id a partir dos slugs
  let areaId: number | null = null
  let vestibularId: number | null = null

  if (searchParams.area) {
    const area = (areas ?? []).find(a => a.slug === searchParams.area)
    areaId = area?.id ?? null
  }
  if (searchParams.vestibular) {
    const vest = (vestibulares ?? []).find(v => v.slug === searchParams.vestibular)
    vestibularId = vest?.id ?? null
  }

  // Query usando IDs diretos — sem join filter
  let query = supabase
    .from('questions')
    .select('*, areas(*), vestibulares(*)', { count: 'exact' })
    .eq('ativo', true)

  if (areaId)       query = query.eq('area_id', areaId)
  if (vestibularId) query = query.eq('vestibular_id', vestibularId)
  if (searchParams.ano) query = query.eq('ano', parseInt(searchParams.ano))

  const { data: questions, count } = await query
    .order('ano', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  const questionIds = (questions ?? []).map((q) => q.id as string)
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