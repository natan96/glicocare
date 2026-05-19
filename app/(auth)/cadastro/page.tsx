'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Activity } from 'lucide-react'

export default function CadastroPage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (senha !== confirmar) {
      setErro('As senhas não coincidem.')
      return
    }
    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setCarregando(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { full_name: nome, role: 'user' },
      },
    })

    if (error) {
      setErro('Erro ao criar conta: ' + error.message)
      setCarregando(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="bg-blue-600 text-white p-3 rounded-2xl">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">GlicoCare</h1>
          <p className="text-sm text-gray-500">Criar sua conta</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Cadastro</CardTitle>
            <CardDescription>Preencha seus dados para começar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCadastro} className="space-y-4">
              {erro && (
                <Alert variant="destructive">
                  <AlertDescription>{erro}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="nome">Seu nome</Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Ex: Ana Clara"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmar">Confirmar senha</Label>
                <Input
                  id="confirmar"
                  type="password"
                  placeholder="Repita a senha"
                  value={confirmar}
                  onChange={e => setConfirmar(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={carregando}>
                {carregando ? 'Criando conta...' : 'Criar conta'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500">
          Já tem conta?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
