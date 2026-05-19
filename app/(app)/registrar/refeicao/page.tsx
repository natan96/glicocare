'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ArrowLeft, UtensilsCrossed } from 'lucide-react'
import Link from 'next/link'

export default function RegistrarRefeicaoPage() {
  const router = useRouter()
  const supabase = createClient()
  const [descricao, setDescricao] = useState('')
  const [carbs, setCarbs] = useState('')
  const [notas, setNotas] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!descricao.trim()) {
      toast.error('Descreva o que comeu')
      return
    }

    setCarregando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase.from('meals').insert({
      user_id: user.id,
      description: descricao.trim(),
      carbs_estimate: carbs ? parseInt(carbs) : null,
      notes: notas || null,
    })

    if (error) {
      toast.error('Erro ao salvar. Tente novamente.')
      setCarregando(false)
      return
    }

    toast.success('Refeição registrada!')
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
          <UtensilsCrossed className="w-5 h-5 text-orange-600" />
          <h1 className="text-lg font-bold">Registrar Refeição</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Descrição */}
        <div className="space-y-1.5">
          <Label htmlFor="descricao">O que você comeu?</Label>
          <Textarea
            id="descricao"
            placeholder="Ex: arroz com frango, salada e suco de laranja"
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            rows={3}
            required
            autoFocus
          />
        </div>

        {/* Carboidratos */}
        <div className="space-y-1.5">
          <Label htmlFor="carbs">Estimativa de carboidratos (opcional)</Label>
          <div className="flex gap-2 items-center">
            <Input
              id="carbs"
              type="number"
              placeholder="Ex: 60"
              value={carbs}
              onChange={e => setCarbs(e.target.value)}
              min={0}
              max={500}
              className="h-12"
            />
            <span className="text-gray-500 font-medium whitespace-nowrap">gramas</span>
          </div>
          <p className="text-xs text-gray-400">
            Não sabe? Deixe em branco. É só uma estimativa.
          </p>
        </div>

        {/* Notas */}
        <div className="space-y-1.5">
          <Label htmlFor="notas">Observações (opcional)</Label>
          <Textarea
            id="notas"
            placeholder="Ex: comeu em restaurante, porção pequena..."
            value={notas}
            onChange={e => setNotas(e.target.value)}
            rows={2}
          />
        </div>

        <Button type="submit" className="w-full h-12 text-base" disabled={carregando}>
          {carregando ? 'Salvando...' : 'Salvar refeição'}
        </Button>
      </form>
    </div>
  )
}
