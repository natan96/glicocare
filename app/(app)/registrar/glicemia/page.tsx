'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { classificarGlicemia, ehCritico } from '@/lib/utils/glicemia'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { ArrowLeft, Droplets, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function RegistrarGlicemiaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [valor, setValor] = useState('')
  const [origem, setOrigem] = useState('dedo')
  const [contexto, setContexto] = useState('outro')
  const [notas, setNotas] = useState('')
  const [carregando, setCarregando] = useState(false)

  const valorNum = parseInt(valor)
  const classificacao = !isNaN(valorNum) && valorNum > 0 ? classificarGlicemia(valorNum) : null
  const critico = classificacao?.critico ?? false

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valorNum || valorNum <= 0 || valorNum >= 1000) {
      toast.error('Informe um valor válido entre 1 e 999 mg/dL')
      return
    }

    setCarregando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase.from('glucose_readings').insert({
      user_id: user.id,
      value: valorNum,
      source: origem,
      context: contexto,
      notes: notas || null,
    })

    if (error) {
      toast.error('Erro ao salvar. Tente novamente.')
      setCarregando(false)
      return
    }

    // Disparar alerta se crítico
    if (ehCritico(valorNum)) {
      fetch('/api/alertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, valor: valorNum }),
      }).catch(() => {})
    }

    toast.success('Glicemia registrada!')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Voltar para o início">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-blue-600" />
          <h1 className="text-lg font-bold">Registrar Glicemia</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Valor */}
        <div className="space-y-2">
          <Label htmlFor="valor">Valor da glicemia</Label>
          <div className="flex gap-2 items-center">
            <Input
              id="valor"
              type="number"
              placeholder="Ex: 120"
              value={valor}
              onChange={e => setValor(e.target.value)}
              min={1}
              max={999}
              className="text-2xl h-14 font-bold tracking-wide"
              required
              autoFocus
            />
            <span className="text-gray-500 font-medium whitespace-nowrap">mg/dL</span>
          </div>

          {/* Feedback visual em tempo real */}
          {classificacao && (
            <div className={`flex items-center gap-2 p-2 rounded-lg ${classificacao.corBg}`}>
              <Badge className={`${classificacao.corBg} ${classificacao.corTexto} border-0`}>
                {classificacao.label}
              </Badge>
            </div>
          )}
        </div>

        {/* Alerta crítico */}
        {critico && (
          <Alert className="border-red-300 bg-red-50">
            <AlertTriangle className="w-4 h-4 text-red-600" aria-hidden="true" />
            <AlertDescription className="text-red-700 font-medium">
              Valor crítico! Os pais serão notificados automaticamente.
            </AlertDescription>
          </Alert>
        )}

        {/* Origem da medição */}
        <div className="space-y-1.5">
          <Label>Como foi medido?</Label>
          <Select value={origem} onValueChange={v => v && setOrigem(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dedo">Glicosímetro (furo no dedo)</SelectItem>
              <SelectItem value="sensor">Sensor contínuo (CGM)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Contexto */}
        <div className="space-y-1.5">
          <Label>Momento da medição</Label>
          <Select value={contexto} onValueChange={v => v && setContexto(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jejum">Em jejum</SelectItem>
              <SelectItem value="pre-refeicao">Antes da refeição</SelectItem>
              <SelectItem value="pos-refeicao">Depois da refeição</SelectItem>
              <SelectItem value="antes-dormir">Antes de dormir</SelectItem>
              <SelectItem value="outro">Outro momento</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notas */}
        <div className="space-y-1.5">
          <Label htmlFor="notas">Observações (opcional)</Label>
          <Textarea
            id="notas"
            placeholder="Ex: acordei com dor de cabeça, comeu bastante antes..."
            value={notas}
            onChange={e => setNotas(e.target.value)}
            rows={2}
          />
        </div>

        <Button type="submit" className="w-full h-12 text-base" disabled={carregando}>
          {carregando ? 'Salvando...' : 'Salvar registro'}
        </Button>
      </form>
    </div>
  )
}
