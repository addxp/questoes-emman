// src/components/layout/AppLayout.tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import {
  BookOpen, Trophy, BarChart2, User, LogOut,
  Menu, X, Zap, Shield, Home, ChevronRight
} from 'lucide-react'

interface Props {
  profile: Profile
  children: React.ReactNode
}

const NAV = [
  { href: '/questoes',         icon: BookOpen,  label: 'Questões' },
  { href: '/enem-do-emman',    icon: Trophy,    label: 'Enem do Emman' },
  { href: '/perfil',           icon: BarChart2, label: 'Meu Desempenho' },
]

export default function AppLayout({ profile, children }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const Sidebar = ({ mobile = false }) => (
    <aside className={`flex flex-col h-full ${mobile ? 'w-full' : 'w-64'}`}>
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
            style={{ background: 'linear-gradient(135deg, #5c5cff, #a855f7)' }}>
            🎯
          </div>
          <div>
            <div className="font-black text-white text-sm leading-tight">Emman</div>
            <div className="text-[#5a5a8a] text-xs">Questões</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`nav-link ${pathname.startsWith(href) ? 'active' : ''}`}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
        {profile.role === 'admin' && (
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className={`nav-link ${pathname.startsWith('/admin') ? 'active' : ''}`}
            style={{ color: '#fbbf24' }}
          >
            <Shield size={16} />
            Painel Admin
          </Link>
        )}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl mb-2"
          style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #5c5cff, #a855f7)' }}>
            {(profile.name || profile.email)?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">
              {profile.name || 'Estudante'}
            </div>
            <div className="text-xs text-[var(--text-muted)] truncate">{profile.email}</div>
          </div>
          {profile.role === 'admin' && (
            <span className="badge text-[9px] px-1.5 py-0.5"
              style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}>
              ADM
            </span>
          )}
        </div>
        <button onClick={handleLogout}
          className="nav-link w-full text-left text-[var(--text-muted)] hover:text-[#fca5a5]">
          <LogOut size={14} /> Sair
        </button>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-[#06060f] flex">
      {/* Sidebar desktop */}
      <div className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 w-64 border-r border-white/5"
        style={{ background: 'var(--bg-surface)' }}>
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)} />
          <div className="absolute left-0 inset-y-0 w-72 border-r border-white/5"
            style={{ background: 'var(--bg-surface)' }}>
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-white/5 glass sticky top-0 z-30">
          <button onClick={() => setOpen(true)} className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-white">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-base">🎯</span>
            <span className="font-bold text-white text-sm">Emman Questões</span>
          </div>
          <div className="w-9" />
        </div>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}