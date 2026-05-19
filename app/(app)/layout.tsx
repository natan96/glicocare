import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/layout/NavBar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar userId={user.id} />
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
