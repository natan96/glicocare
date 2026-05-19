'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { classificarGlicemia } from '@/lib/utils/glicemia'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Droplets, Activity, AlertTriangle, LogOut, RefreshCw
} from 'lucide-react'

interface GlicemiaRow {
  id: string
  value: number
  source: string
  context: string
  recorded_at: string
}

export default function PaisPage() {
  const [logado, setLogado] = useState(false)
  const [carregandoLogin, setCarregandoLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erroLogin, setErroLogin] = useState('')
  const [afilhadaNome, setAfilhadaNome] = useState('')
  const [glicemias, setGlicemias] = useState<GlicemiaRow[]>([])
  const [carregando, setCarregando] = useState(false)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setLogado(true); setUserId(user.id); carregarDados(user.id) }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function carregarDados(uid: string) {
    const supabase = createClient()
    setCarregando(true)
    const { data: profile } = await supabase
      .from('profiles')
      .select('parent_of')
      .eq('id', uid)
      .single()

    if (!profile?.parent_of) { setCarregando(false); return }

    const { data: afilhada } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', profile.parent_of)
      .single()

    if (afilhada) setAfilhadaNome(afilhada.full_name)

    const ontem = new Date()
    ontem.setDate(ontem.getDate() - 1)

    const { data: glics } = await supabase
      .from('glucose_readings')
      .select('*')
      .eq('user_id', profile.parent_of)
      .gte('recorded_at', ontem.toISOString())
      .order('recorded_at', { ascending: false })

    if (glics) setGlicemias(glics)
    setCarregando(false)

    // Assinar atualizações em tempo real
    supabase
      .channel('pais-glicemia')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'glucose_readings',
        filter: `user_id=eq.${profile.parent_of}`,
      }, (payload) => {
        setGlicemias(prev => [payload.new as GlicemiaRow, ...prev])
      })
      .subscribe()
  }

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setErroLogin('')
    setCarregandoLogin(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      setErroLogin('Email ou senha incorretos.')
      setCarregandoLogin(false)
      return
    }
    setLogado(true)
    setUserId(data.user.id)
    await carregarDados(data.user.id)
    setCarregandoLogin(false)
  }

  async function sair() {
    await createClient().auth.signOut()
    setLogado(false)
    setGlicemias([])
  }

  const ultimaGlic = glicemias[0]
  const classificacao = ultimaGlic ? classificarGlicemia(ultimaGlic.value) : null

  if (!logado) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col items-center gap-2">
            <div className="bg-blue-600 text-white p-3 rounded-2xl">
              <Activity className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">GlicoCare</h1>
            <p className="text-sm text-gray-500">Painel familiar</p>
          </div>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Entrar</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={login} className="space-y-4">
                {erroLogin && (
                  <Alert variant="destructive">
                    <AlertDescription>{erroLogin}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Senha</Label>
                  <Input type="password" value={senha} onChange={e => setSenha(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={carregandoLogin}>
                  {carregandoLogin ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h1 className="font-bold text-gray-900">
              {afilhadaNome ? afilhadaNome : 'Painel familiar'}
            </h1>
            <p className="text-xs text-gray-500">Acompanhamento em tempo real</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => carregarDados(userId)} disabled={carregando} aria-label="Atualizar dados">
              <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon" onClick={sair} aria-label="Sair da conta">
              <LogOut className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Última glicemia */}
        {ultimaGlic && classificacao ? (
          <Card className={`border-2 ${classificacao.critico ? 'border-red-400' : 'border-green-300'}`}>
            <CardContent className="pt-4 pb-4">
              {classificacao.critico && (
                <Alert className="mb-3 bg-red-50 border-red-300">
                  <AlertTriangle className="w-4 h-4 text-red-600" aria-hidden="true" />
                  <AlertDescription className="text-red-700 font-medium text-sm">
                    Glicemia em nível crítico!
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Última glicemia registrada</p>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-bold text-gray-900">{ultimaGlic.value}</span>
                    <span className="text-sm text-gray-500 mb-2">mg/dL</span>
                  </div>
                  <Badge className={`${classificacao.corBg} ${classificacao.corTexto} border-0 mt-1`}>
                    {classificacao.label}
                  </Badge>
                </div>
                <Droplets className={`w-14 h-14 opacity-15 ${classificacao.corTexto}`} />
              </div>
              <p className="text-xs text-gray-500 mt-3">
                {formatDistanceToNow(new Date(ultimaGlic.recorded_at), { addSuffix: true, locale: ptBR })}
                {' · '}
                {format(new Date(ultimaGlic.recorded_at), "HH:mm 'de' dd/MM", { locale: ptBR })}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <Droplets className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Nenhuma glicemia nas últimas 24h</p>
            </CardContent>
          </Card>
        )}

        {/* Histórico do dia */}
        {glicemias.length > 1 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Registros das últimas 24h</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 divide-y">
              {glicemias.map((g) => {
                const c = classificarGlicemia(g.value)
                return (
                  <div key={g.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{g.value}</span>
                      <span className="text-xs text-gray-500">mg/dL</span>
                      <Badge className={`${c.corBg} ${c.corTexto} border-0 text-xs`}>
                        {c.label}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(g.recorded_at), 'HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-gray-500 text-center">
          Atualiza automaticamente quando um novo registro é feito
        </p>
      </div>
    </div>
  )
}
