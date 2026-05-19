import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { email, nome, afilhadaId } = await req.json()

  if (!email || !nome || !afilhadaId) {
    return NextResponse.json({ erro: 'Dados incompletos' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Convida o pai via Supabase Auth (ele receberá email com link para criar senha)
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { full_name: nome, role: 'parent' },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/pais`,
  })

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 })
  }

  // Vincular pai à afilhada e salvar email para alertas
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ parent_of: afilhadaId, alert_email: email })
    .eq('id', data.user.id)

  if (profileError) {
    return NextResponse.json({ erro: 'Erro ao vincular perfil' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
