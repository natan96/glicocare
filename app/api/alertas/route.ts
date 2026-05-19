import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { classificarGlicemia } from '@/lib/utils/glicemia'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { userId, valor } = await req.json()

  if (!userId || !valor) {
    return NextResponse.json({ erro: 'Dados inválidos' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Buscar pais vinculados
  const { data: pais } = await supabase
    .from('profiles')
    .select('full_name, alert_email')
    .eq('parent_of', userId)
    .eq('role', 'parent')

  if (!pais || pais.length === 0) {
    return NextResponse.json({ ok: true, msg: 'Sem pais cadastrados' })
  }

  // Buscar nome da afilhada
  const { data: afilhada } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single()

  const nome = afilhada?.full_name ?? 'Sua filha'
  const classificacao = classificarGlicemia(valor)
  const horario = format(new Date(), "HH:mm 'do dia' dd/MM/yyyy", { locale: ptBR })

  const destinatarios = pais
    .filter(p => p.alert_email)
    .map(p => p.alert_email as string)

  if (destinatarios.length === 0) {
    return NextResponse.json({ ok: true, msg: 'Sem emails configurados' })
  }

  const assunto = valor < 54
    ? `⚠️ HIPOGLICEMIA SEVERA — ${nome} registrou ${valor} mg/dL`
    : `⚠️ HIPERGLICEMIA SEVERA — ${nome} registrou ${valor} mg/dL`

  const corpo = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #dc2626; margin-bottom: 8px;">⚠️ Alerta de Glicemia</h2>
      <p style="color: #374151; font-size: 15px; margin-bottom: 16px;">
        <strong>${nome}</strong> registrou uma glicemia em nível crítico.
      </p>
      <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 12px; padding: 20px; margin-bottom: 16px; text-align: center;">
        <div style="font-size: 48px; font-weight: bold; color: #dc2626;">${valor}</div>
        <div style="font-size: 16px; color: #6b7280;">mg/dL</div>
        <div style="margin-top: 8px; font-size: 14px; font-weight: 600; color: #dc2626;">${classificacao.label}</div>
      </div>
      <p style="color: #6b7280; font-size: 13px;">Registrado às ${horario}</p>
      <p style="color: #374151; font-size: 14px; margin-top: 16px;">
        Entre em contato com ela o mais breve possível.
      </p>
      <hr style="margin: 24px 0; border-color: #e5e7eb;" />
      <p style="color: #9ca3af; font-size: 12px;">GlicoCare — Acompanhamento de diabetes</p>
    </div>
  `

  try {
    await resend.emails.send({
      from: 'GlicoCare <onboarding@resend.dev>',
      to: destinatarios,
      subject: assunto,
      html: corpo,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Erro ao enviar email:', err)
    return NextResponse.json({ erro: 'Falha ao enviar email' }, { status: 500 })
  }
}
