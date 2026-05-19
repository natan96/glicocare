import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { classificarGlicemia } from '@/lib/utils/glicemia'
import { format, subDays, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import GlicemiaChart from '@/components/charts/GlicemiaChart'
import { Droplets, Syringe, UtensilsCrossed, Dumbbell } from 'lucide-react'

export default async function HistoricoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const hoje = new Date()
  const inicioDia = subDays(hoje, 1)
  const inicioSemana = subDays(hoje, 7)
  const inicioMes = subMonths(hoje, 1)

  const [{ data: glicemiaDia }, { data: glicemiaSemana }, { data: glicemiaMes },
    { data: insulinasHoje }, { data: refeicoesHoje }, { data: atividadesHoje }] =
    await Promise.all([
      supabase.from('glucose_readings').select('*').eq('user_id', user.id)
        .gte('recorded_at', inicioDia.toISOString()).order('recorded_at'),
      supabase.from('glucose_readings').select('*').eq('user_id', user.id)
        .gte('recorded_at', inicioSemana.toISOString()).order('recorded_at'),
      supabase.from('glucose_readings').select('*').eq('user_id', user.id)
        .gte('recorded_at', inicioMes.toISOString()).order('recorded_at'),
      supabase.from('insulin_doses').select('*').eq('user_id', user.id)
        .gte('recorded_at', inicioDia.toISOString()).order('recorded_at', { ascending: false }),
      supabase.from('meals').select('*').eq('user_id', user.id)
        .gte('recorded_at', inicioDia.toISOString()).order('recorded_at', { ascending: false }),
      supabase.from('physical_activities').select('*').eq('user_id', user.id)
        .gte('recorded_at', inicioDia.toISOString()).order('recorded_at', { ascending: false }),
    ])

  return (
    <div className="space-y-5 pb-4">
      <h1 className="text-xl font-bold text-gray-900">Histórico</h1>

      {/* Gráfico por período */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-500" />
            Glicemia ao longo do tempo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="semana">
            <TabsList className="mb-4 h-8">
              <TabsTrigger value="dia" className="text-xs">24h</TabsTrigger>
              <TabsTrigger value="semana" className="text-xs">7 dias</TabsTrigger>
              <TabsTrigger value="mes" className="text-xs">30 dias</TabsTrigger>
            </TabsList>
            <TabsContent value="dia">
              {glicemiaDia && glicemiaDia.length > 0
                ? <GlicemiaChart dados={glicemiaDia} modo="dia" />
                : <p className="text-sm text-gray-500 text-center py-8">Sem registros nas últimas 24h</p>}
            </TabsContent>
            <TabsContent value="semana">
              {glicemiaSemana && glicemiaSemana.length > 0
                ? <GlicemiaChart dados={glicemiaSemana} modo="semana" />
                : <p className="text-sm text-gray-500 text-center py-8">Sem registros nos últimos 7 dias</p>}
            </TabsContent>
            <TabsContent value="mes">
              {glicemiaMes && glicemiaMes.length > 0
                ? <GlicemiaChart dados={glicemiaMes} modo="mes" />
                : <p className="text-sm text-gray-500 text-center py-8">Sem registros nos últimos 30 dias</p>}
            </TabsContent>
          </Tabs>

          {/* Legenda */}
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-0.5 bg-green-500" /> 70–180 mg/dL (alvo)
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-0.5 bg-red-500" /> &lt;54 / &gt;250 (crítico)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Registros de hoje */}
      <h2 className="font-semibold text-gray-700">Últimas 24 horas</h2>

      {/* Glicemias */}
      {glicemiaDia && glicemiaDia.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-500" /> Glicemia
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 divide-y">
            {[...glicemiaDia].reverse().map((r) => {
              const c = classificarGlicemia(r.value)
              return (
                <div key={r.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-900">{r.value}</span>
                    <div>
                      <Badge className={`${c.corBg} ${c.corTexto} border-0 text-xs`}>
                        {c.label}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-0.5">{r.source === 'dedo' ? 'Dedo' : 'Sensor'}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {format(new Date(r.recorded_at), 'HH:mm', { locale: ptBR })}
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Insulinas */}
      {insulinasHoje && insulinasHoje.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Syringe className="w-4 h-4 text-purple-500" /> Insulina
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 divide-y">
            {insulinasHoje.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2.5">
                <div>
                  <span className="font-medium text-sm">{r.amount} unidades</span>
                  <p className="text-xs text-gray-500">
                    {r.insulin_type === 'bolus' ? 'Bolus (rápida)' : 'Basal (lenta)'}
                    {r.brand ? ` · ${r.brand}` : ''}
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {format(new Date(r.recorded_at), 'HH:mm', { locale: ptBR })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Refeições */}
      {refeicoesHoje && refeicoesHoje.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-orange-500" /> Refeições
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 divide-y">
            {refeicoesHoje.map((r) => (
              <div key={r.id} className="flex items-start justify-between py-2.5 gap-3">
                <div>
                  <p className="text-sm text-gray-800">{r.description}</p>
                  {r.carbs_estimate && (
                    <p className="text-xs text-gray-500 mt-0.5">~{r.carbs_estimate}g de carbs</p>
                  )}
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {format(new Date(r.recorded_at), 'HH:mm', { locale: ptBR })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Atividades */}
      {atividadesHoje && atividadesHoje.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-green-500" /> Atividades
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 divide-y">
            {atividadesHoje.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2.5">
                <div>
                  <span className="font-medium text-sm">{r.activity_type}</span>
                  <p className="text-xs text-gray-500">{r.duration_minutes} min · {r.intensity}</p>
                </div>
                <span className="text-xs text-gray-500">
                  {format(new Date(r.recorded_at), 'HH:mm', { locale: ptBR })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Vazio */}
      {(!glicemiaDia?.length && !insulinasHoje?.length && !refeicoesHoje?.length && !atividadesHoje?.length) && (
        <p className="text-sm text-gray-500 text-center py-8">
          Nenhum registro nas últimas 24 horas.
        </p>
      )}
    </div>
  )
}
