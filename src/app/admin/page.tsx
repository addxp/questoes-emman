// src/app/admin/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import AdminDashboard from './AdminDashboard'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

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

  if (safeProfile?.role !== 'admin') redirect('/questoes')

  const [
    { count: totalQuestions },
    { count: totalUsers },
    { count: totalAnswers },
    { count: totalExams },
    { data: areas },
    { data: vestibulares },
    { data: recentQuestions },
  ] = await Promise.all([
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('user_answers').select('*', { count: 'exact', head: true }),
    supabase.from('weekly_exams').select('*', { count: 'exact', head: true }),
    supabase.from('areas').select('*').order('name'),
    supabase.from('vestibulares').select('*').order('name'),
    supabase.from('questions').select('*, areas(*), vestibulares(*)').order('created_at', { ascending: false }).limit(5),
  ])

  return (
    <AppLayout profile={safeProfile}>
      <AdminDashboard
        stats={{ totalQuestions, totalUsers, totalAnswers, totalExams }}
        areas={areas || []}
        vestibulares={vestibulares || []}
        recentQuestions={recentQuestions || []}
      />
    </AppLayout>
  )
}