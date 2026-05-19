export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { classificarGlicemia } from '@/lib/utils/glicemia'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Droplets, Syringe, UtensilsCrossed, Dumbbell, Stethoscope, ChevronRight
} from 'lucide-react'

const botoesRegistro = [
  { href: '/registrar/glicemia', label: 'Glicemia', icon: Droplets, cor: 'bg-blue-50 text-blue-600 border-blue-200' },
  { href: '/registrar/insulina', label: 'Insulina', icon: Syringe, cor: 'bg-purple-50 text-purple-600 border-purple-200' },
  { href: '/registrar/refeicao', label: 'Refeição', icon: UtensilsCrossed, cor: 'bg-orange-50 text-orange-600 border-orange-200' },
  { href: '/registrar/atividade', label: 'Atividade', icon: Dumbbell, cor: 'bg-green-50 text-green-600 border-green-200' },
  { href: '/registrar/humor', label: 'Sintomas', icon: Stethoscope, cor: 'bg-pink-50 text-pink-600 border-pink-200' },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const [{ data: profile }, { data: ultimaGlicemia }, { data: registrosHoje }] =
    await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', user.id).single(),
      supabase
        .from('glucose_readings')
        .select('value, recorded_at, context')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('glucose_readings')
        .select('id')
        .eq('user_id', user.id)
        .gte('recorded_at', hoje.toISOString()),
    ])

  const nomeCompleto = profile?.full_name || (user.user_metadata?.full_name as string | undefined)
  const primeiroNome = nomeCompleto?.split(' ')[0] ?? null
  const ultimaGlic = ultimaGlicemia
  const classificacao = ultimaGlic ? classificarGlicemia(ultimaGlic.value) : null

  return (
    <div className="space-y-6 pb-4">
      {/* Saudação */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {primeiroNome ? `Olá, ${primeiroNome}!` : 'Olá!'}
        </h1>
        <p className="text-sm text-gray-500">
          {hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Card da última glicemia */}
      {ultimaGlic && classificacao ? (
        <Card className={`border-2 ${classificacao.corBg} border-current`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Última glicemia</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-gray-900">{ultimaGlic.value}</span>
                  <span className="text-sm text-gray-500 mb-1.5">mg/dL</span>
                </div>
                <Badge className={`${classificacao.corBg} ${classificacao.corTexto} border-0 mt-1`}>
                  {classificacao.label}
                </Badge>
              </div>
              <Droplets className={`w-12 h-12 opacity-20 ${classificacao.corTexto}`} />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {formatDistanceToNow(new Date(ultimaGlic.recorded_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="pt-6 pb-6 text-center">
            <Droplets className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Nenhuma glicemia registrada ainda</p>
            <p className="text-xs text-gray-500 mt-1">Registre sua primeira medição!</p>
          </CardContent>
        </Card>
      )}

      {/* Resumo do dia */}
      {registrosHoje && registrosHoje.length > 0 && (
        <p className="text-sm text-gray-600">
          Você fez <strong>{registrosHoje.length}</strong> registro
          {registrosHoje.length > 1 ? 's' : ''} de glicemia hoje.
        </p>
      )}

      {/* Botões de registro rápido */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Registrar agora</h2>
        <div className="grid grid-cols-5 gap-2">
          {botoesRegistro.map(({ href, label, icon: Icon, cor }) => (
            <Link key={href} href={href}>
              <div className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border ${cor} transition-transform active:scale-95`}>
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium leading-tight text-center">{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Link para histórico */}
      <Link href="/historico" className="block mt-4">
        <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Ver histórico completo</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
