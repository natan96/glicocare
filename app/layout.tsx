import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'GlicoCare',
  description: 'Acompanhamento de glicemia e diabetes',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="font-sans antialiased bg-gray-50 min-h-screen">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
