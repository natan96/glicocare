'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ArrowLeft, Stethoscope } from 'lucide-react'
import Link from 'next/link'

const SINTOMAS = [
  'Sem sintomas',
  'Tontura',
  'Tremor',
  'Fraqueza',
  'Suor frio',
  'Dor de cabeça',
  'Náusea',
  'Visão turva',
  'Cansaço excessivo',
  'Muita sede',
  'Fome excessiva',
  'Irritabilidade',
  'Formigamento',
  'Palpitação',
]

export default function RegistrarSintomasPage() {
  const router = useRouter()
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [notas, setNotas] = useState('')
  const [carregando, setCarregando] = useState(false)

  function toggleSintoma(sintoma: string) {
    if (sintoma === 'Sem sintomas') {
      setSelecionados(['Sem sintomas'])
      return
    }
    setSelecionados(prev => {
      const semSintomas = prev.filter(s => s !== 'Sem sintomas')
      return semSintomas.includes(sintoma)
        ? semSintomas.filter(s => s !== sintoma)
        : [...semSintomas, sintoma]
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selecionados.length === 0) {
      toast.error('Selecione pelo menos um sintoma')
      return
    }

    setCarregando(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase.from('mood_entries').insert({
      user_id: user.id,
      mood_level: selecionados.join(', '),
      notes: notas || null,
    })

    if (error) {
      toast.error('Erro ao salvar. Tente novamente.')
      setCarregando(false)
      return
    }

    toast.success('Sintomas registrados!')
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
          <Stethoscope className="w-5 h-5 text-pink-600" />
          <h1 className="text-lg font-bold">Registrar Sintomas</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label>Como você está se sentindo agora?</Label>
          <p className="text-xs text-gray-500">Selecione todos que se aplicam</p>
          <div className="flex flex-wrap gap-2">
            {SINTOMAS.map(sintoma => {
              const ativo = selecionados.includes(sintoma)
              return (
                <button
                  key={sintoma}
                  type="button"
                  onClick={() => toggleSintoma(sintoma)}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                    ativo
                      ? 'bg-pink-100 border-pink-400 text-pink-700'
                      : 'bg-white border-gray-200 text-gray-600'
                  }`}
                >
                  {sintoma}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notas">Observações (opcional)</Label>
          <Textarea
            id="notas"
            placeholder="Ex: tontura começou depois do almoço, passa rápido..."
            value={notas}
            onChange={e => setNotas(e.target.value)}
            rows={3}
          />
        </div>

        <Button
          type="submit"
          className="w-full h-12 text-base"
          disabled={carregando || selecionados.length === 0}
        >
          {carregando ? 'Salvando...' : 'Salvar sintomas'}
        </Button>
      </form>
    </div>
  )
}
