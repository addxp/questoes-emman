// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Banco de Questões Emman',
  description: 'Prepare-se para o ENEM e vestibulares com o melhor banco de questões do Brasil.',
  keywords: ['ENEM', 'vestibular', 'questões', 'banco de questões', 'simulado'],
  openGraph: {
    title: 'Banco de Questões Emman',
    description: 'ENEM 2011→atual + vestibulares. Pratique, evolua, conquiste.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="bg-[#06060f] text-[#f0f0ff] antialiased">
        {children}
      </body>
    </html>
  )
}