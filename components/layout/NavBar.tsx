'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Activity, LayoutDashboard, History, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/historico', label: 'Histórico', icon: History },
  { href: '/configuracoes', label: 'Config.', icon: Settings },
]

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function NavBar({ userId }: { userId: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Header desktop */}
      <header className="hidden sm:flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-blue-600">
          <Activity className="w-5 h-5" />
          GlicoCare
        </Link>
        <nav className="flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <Button
                variant={pathname.startsWith(href) ? 'secondary' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Button>
            </Link>
          ))}
          <Button variant="ghost" size="sm" onClick={sair} className="gap-2 ml-2">
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </nav>
      </header>

      {/* Nav mobile — barra inferior */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex z-50">
        {navLinks.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex-1">
            <div className={cn(
              'flex flex-col items-center gap-0.5 py-2 text-xs',
              pathname.startsWith(href) ? 'text-blue-600' : 'text-gray-500'
            )}>
              <Icon className="w-5 h-5" />
              {label}
            </div>
          </Link>
        ))}
        <button onClick={sair} className="flex-1">
          <div className="flex flex-col items-center gap-0.5 py-2 text-xs text-gray-500">
            <LogOut className="w-5 h-5" />
            Sair
          </div>
        </button>
      </nav>

      {/* Espaço para a nav mobile não sobrepor conteúdo */}
      <div className="sm:hidden h-16" />
    </>
  )
}
