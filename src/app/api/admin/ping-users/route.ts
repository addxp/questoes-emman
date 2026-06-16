// src/app/api/admin/ping-users/route.ts
import { createServiceClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // Verifica admin
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { title, message } = await req.json()
  if (!title || !message) return NextResponse.json({ error: 'title e message obrigatórios' }, { status: 400 })

  // Busca todos os e-mails
  const service = createServiceClient()
  const { data: users, error } = await service.from('profiles').select('email, name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Envia usando Supabase Auth Admin (e-mail transacional)
  // Alternativa: Resend, SendGrid, etc.
  // Por ora, usa a Edge Function do Supabase para enviar e-mails em lote
  let sent = 0
  const emails = (users ?? []).filter(u => u.email)

  for (const u of emails) {
    try {
      // Supabase não tem send_email nativo em route handlers
      // Usa fetch para a edge function que criamos
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-ping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          to: u.email,
          name: u.name ?? u.email.split('@')[0],
          subject: title,
          message,
          site_url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://questoes-emman.vercel.app',
        }),
      })
      sent++
    } catch { /* continua */ }
  }

  return NextResponse.json({ ok: true, sent })
}