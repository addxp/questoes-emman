// supabase/functions/send-ping/index.ts
// Deploy com: npx supabase functions deploy send-ping

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? ''

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const { to, name, subject, message, site_url } = await req.json()

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Inter, sans-serif; background: #06060f; color: #f0f0ff; padding: 40px 20px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #5c5cff, #a855f7); border-radius: 12px; line-height: 48px; font-size: 24px; text-align: center;">🎯</div>
      <h1 style="color: #f0f0ff; font-size: 20px; margin: 12px 0 0;">Emman Questões</h1>
    </div>
    
    <div style="background: #13132a; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 32px;">
      <p style="color: #9898c8; margin: 0 0 8px;">Olá, <strong style="color: #f0f0ff;">${name}</strong> 👋</p>
      <h2 style="color: #f0f0ff; font-size: 22px; margin: 0 0 20px;">${subject}</h2>
      <p style="color: #9898c8; line-height: 1.7; margin: 0 0 28px; white-space: pre-wrap;">${message}</p>
      <a href="${site_url}" style="display: inline-block; background: linear-gradient(135deg, #5c5cff, #a855f7); color: white; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px;">
        Acessar o site →
      </a>
    </div>

    <p style="color: #5a5a8a; font-size: 12px; text-align: center; margin-top: 24px;">
      Você recebeu este e-mail pois está cadastrado no Emman Questões.
    </p>
  </div>
</body>
</html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_KEY}`,
    },
    body: JSON.stringify({
      from: 'Emman Questões <noreply@questoes-emman.vercel.app>',
      to: [to],
      subject,
      html,
    }),
  })

  const data = await res.json()
  return new Response(JSON.stringify(data), {
    status: res.ok ? 200 : 500,
    headers: { 'Content-Type': 'application/json' },
  })
})