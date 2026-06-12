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
  if (profile?.role !== 'admin') redirect('/questoes')

  // Estatísticas gerais
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
    <AppLayout profile={profile}>
      <AdminDashboard
        stats={{ totalQuestions, totalUsers, totalAnswers, totalExams }}
        areas={areas || []}
        vestibulares={vestibulares || []}
        recentQuestions={recentQuestions || []}
      />
    </AppLayout>
  )
}