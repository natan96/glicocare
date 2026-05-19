'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ArrowLeft, Dumbbell } from 'lucide-react'
import Link from 'next/link'

const atividadesComuns = [
  'Caminhada', 'Corrida', 'Natação', 'Musculação', 'Ciclismo',
  'Dança', 'Yoga', 'Futebol', 'Vôlei', 'Pilates',
]

const intensidades = [
  { value: 'leve', label: 'Leve', desc: 'Pouca transpiração' },
  { value: 'moderada', label: 'Moderada', desc: 'Transpira, mas conversa' },
  { value: 'intensa', label: 'Intensa', desc: 'Difícil de falar' },
]

export default function RegistrarAtividadePage() {
  const router = useRouter()
  const supabase = createClient()
  const [tipo, setTipo] = useState('')
  const [duracao, setDuracao] = useState('')
  const [intensidade, setIntensidade] = useState('moderada')
  const [notas, setNotas] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tipo.trim()) { toast.error('Informe o tipo de atividade'); return }
    if (!duracao || parseInt(duracao) <= 0) { toast.error('Informe a duração'); return }

    setCarregando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase.from('physical_activities').insert({
      user_id: user.id,
      activity_type: tipo.trim(),
      duration_minutes: parseInt(duracao),
      intensity: intensidade,
      notes: notas || null,
    })

    if (error) {
      toast.error('Erro ao salvar. Tente novamente.')
      setCarregando(false)
      return
    }

    toast.success('Atividade registrada!')
    router.push('/dashboard')
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
          <Dumbbell className="w-5 h-5 text-green-600" />
          <h1 className="text-lg font-bold">Registrar Atividade</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tipo */}
        <div className="space-y-2">
          <Label htmlFor="tipo">Qual atividade?</Label>
          <Input
            id="tipo"
            type="text"
            placeholder="Ex: Caminhada, Natação..."
            value={tipo}
            onChange={e => setTipo(e.target.value)}
            required
            autoFocus
          />
          <div className="flex flex-wrap gap-1.5">
            {atividadesComuns.map(a => (
              <button
                key={a}
                type="button"
                onClick={() => setTipo(a)}
                className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                  tipo === a ? 'bg-green-100 border-green-400 text-green-700' : 'bg-white border-gray-200 text-gray-600'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Duração */}
        <div className="space-y-1.5">
          <Label htmlFor="duracao">Duração</Label>
          <div className="flex gap-2 items-center">
            <Input
              id="duracao"
              type="number"
              placeholder="Ex: 30"
              value={duracao}
              onChange={e => setDuracao(e.target.value)}
              min={1}
              max={600}
              className="h-12"
              required
            />
            <span className="text-gray-500 font-medium whitespace-nowrap">minutos</span>
          </div>
        </div>

        {/* Intensidade */}
        <div className="space-y-1.5">
          <Label>Intensidade</Label>
          <div className="grid grid-cols-3 gap-2">
            {intensidades.map(op => (
              <button
                key={op.value}
                type="button"
                onClick={() => setIntensidade(op.value)}
                className={`p-2.5 rounded-xl border-2 text-center transition-colors ${
                  intensidade === op.value
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="font-medium text-sm">{op.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{op.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Notas */}
        <div className="space-y-1.5">
          <Label htmlFor="notas">Observações (opcional)</Label>
          <Textarea
            id="notas"
            placeholder="Ex: saiu com o cachorro, foi na academia..."
            value={notas}
            onChange={e => setNotas(e.target.value)}
            rows={2}
          />
        </div>

        <Button type="submit" className="w-full h-12 text-base" disabled={carregando}>
          {carregando ? 'Salvando...' : 'Salvar atividade'}
        </Button>
      </form>
    </div>
  )
}
