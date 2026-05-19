'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ArrowLeft, Syringe } from 'lucide-react'
import Link from 'next/link'

export default function RegistrarInsulinaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [quantidade, setQuantidade] = useState('')
  const [tipo, setTipo] = useState('bolus')
  const [marca, setMarca] = useState('')
  const [notas, setNotas] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const qtd = parseFloat(quantidade)
    if (!qtd || qtd <= 0) {
      toast.error('Informe a quantidade de unidades')
      return
    }

    setCarregando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase.from('insulin_doses').insert({
      user_id: user.id,
      amount: qtd,
      insulin_type: tipo,
      brand: marca || null,
      notes: notas || null,
    })

    if (error) {
      toast.error('Erro ao salvar. Tente novamente.')
      setCarregando(false)
      return
    }

    toast.success('Insulina registrada!')
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
          <Syringe className="w-5 h-5 text-purple-600" />
          <h1 className="text-lg font-bold">Registrar Insulina</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tipo de insulina */}
        <div className="space-y-1.5">
          <Label>Tipo de insulina</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'bolus', label: 'Bolus', desc: 'Rápida / refeição' },
              { value: 'basal', label: 'Basal', desc: 'Lenta / prolongada' },
            ].map(op => (
              <button
                key={op.value}
                type="button"
                onClick={() => setTipo(op.value)}
                className={`p-3 rounded-xl border-2 text-left transition-colors ${
                  tipo === op.value
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="font-medium text-sm">{op.label}</div>
                <div className="text-xs text-gray-500">{op.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Quantidade */}
        <div className="space-y-1.5">
          <Label htmlFor="quantidade">Quantidade</Label>
          <div className="flex gap-2 items-center">
            <Input
              id="quantidade"
              type="number"
              placeholder="Ex: 6"
              value={quantidade}
              onChange={e => setQuantidade(e.target.value)}
              min={0.5}
              step={0.5}
              className="text-xl h-12 font-bold"
              required
              autoFocus
            />
            <span className="text-gray-500 font-medium whitespace-nowrap">unidades</span>
          </div>
        </div>

        {/* Marca/nome */}
        <div className="space-y-1.5">
          <Label htmlFor="marca">Nome da insulina (opcional)</Label>
          <Input
            id="marca"
            type="text"
            placeholder="Ex: Lantus, Novorapid, Tresiba..."
            value={marca}
            onChange={e => setMarca(e.target.value)}
          />
        </div>

        {/* Notas */}
        <div className="space-y-1.5">
          <Label htmlFor="notas">Observações (opcional)</Label>
          <Textarea
            id="notas"
            placeholder="Ex: aplicou na barriga, esqueceu ontem..."
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
