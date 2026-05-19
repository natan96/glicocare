'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Settings, UserPlus, Bell, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ConfiguracoesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [emailPai, setEmailPai] = useState('')
  const [nomePai, setNomePai] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [enviandoConvite, setEnviandoConvite] = useState(false)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    async function carregarPerfil() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      if (data) setNome(data.full_name)
    }
    carregarPerfil()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function salvarNome(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    setCarregando(true)

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: nome.trim() })
      .eq('id', userId)

    if (error) { toast.error('Erro ao salvar'); setCarregando(false); return }
    toast.success('Nome atualizado!')
    setCarregando(false)
  }

  async function convidarPai(e: React.FormEvent) {
    e.preventDefault()
    if (!emailPai || !nomePai) { toast.error('Preencha nome e email'); return }
    setEnviandoConvite(true)

    // Cria conta do pai via admin + vincula ao usuário principal
    const res = await fetch('/api/convidar-pai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailPai, nome: nomePai, afilhadaId: userId }),
    })

    const json = await res.json()
    if (!res.ok) {
      toast.error(json.erro ?? 'Erro ao enviar convite')
      setEnviandoConvite(false)
      return
    }

    toast.success(`Convite enviado para ${emailPai}!`)
    setEmailPai('')
    setNomePai('')
    setEnviandoConvite(false)
  }

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-gray-600" />
        <h1 className="text-lg font-bold">Configurações</h1>
      </div>

      {/* Perfil */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Meu perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={salvarNome} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Seu nome</Label>
              <Input
                id="nome"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>
            <Button type="submit" size="sm" disabled={carregando}>
              {carregando ? 'Salvando...' : 'Salvar nome'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Adicionar pai */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-blue-600" />
            <CardTitle className="text-base">Adicionar pai ou mãe</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Eles receberão um email para criar a senha e poderão ver seus registros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={convidarPai} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="nomePai">Nome do familiar</Label>
              <Input
                id="nomePai"
                value={nomePai}
                onChange={e => setNomePai(e.target.value)}
                placeholder="Ex: Mãe, Papai..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emailPai">Email do familiar</Label>
              <Input
                id="emailPai"
                type="email"
                value={emailPai}
                onChange={e => setEmailPai(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <Button type="submit" size="sm" variant="outline" disabled={enviandoConvite}>
              {enviandoConvite ? 'Enviando...' : 'Enviar convite'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Alertas */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-orange-500" />
            <CardTitle className="text-base">Alertas automáticos</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Quando você registrar uma glicemia crítica (&lt;54 ou &gt;250 mg/dL), um email
            será enviado automaticamente para os familiares cadastrados.
          </p>
        </CardContent>
      </Card>

      <Separator />

      <Button variant="outline" className="w-full gap-2 text-red-600 hover:text-red-700" onClick={sair}>
        <LogOut className="w-4 h-4" />
        Sair da conta
      </Button>
    </div>
  )
}
