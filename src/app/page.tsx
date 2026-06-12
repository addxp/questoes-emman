'use client'
// src/app/page.tsx
import Link from 'next/link'
import { ArrowRight, Zap, Trophy, BookOpen, Target, Star } from 'lucide-react'

const STATS = [
  { value: '5.000+', label: 'Questões cadastradas' },
  { value: '2011–2024', label: 'Anos do ENEM' },
  { value: '13', label: 'Disciplinas' },
  { value: '7', label: 'Vestibulares' },
]

const AREAS = [
  { icon: '🧬', name: 'Biologia', color: '#22c55e' },
  { icon: '⚡', name: 'Física', color: '#f59e0b' },
  { icon: '🧪', name: 'Química', color: '#10b981' },
  { icon: '📐', name: 'Matemática', color: '#6366f1' },
  { icon: '🏛️', name: 'História', color: '#ef4444' },
  { icon: '🌍', name: 'Geografia', color: '#3b82f6' },
  { icon: '📚', name: 'Português', color: '#f97316' },
  { icon: '🤔', name: 'Filosofia', color: '#8b5cf6' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#06060f] relative overflow-x-hidden">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #5c5cff, transparent 70%)' }} />
        <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #a855f7, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #ec4899, transparent 70%)' }} />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
              style={{ background: 'linear-gradient(135deg, #5c5cff, #a855f7)' }}>
              🎯
            </div>
            <span className="font-bold text-white text-lg tracking-tight">Emman</span>
            <span className="text-[var(--text-muted)] text-lg">Questões</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            <Link href="#areas" className="nav-link">Disciplinas</Link>
            <Link href="#enem-emman" className="nav-link">Enem do Emman</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="btn-ghost text-sm">Entrar</Link>
            <Link href="/auth/registro" className="btn-primary text-sm">
              Começar grátis <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8"
            style={{ background: 'rgba(92,92,255,0.12)', border: '1px solid rgba(92,92,255,0.25)', color: '#a3a3ff' }}>
            <Zap size={12} className="text-[#5c5cff]" />
            ENEM 2011 → 2024 + Vestibulares
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-[0.95] tracking-tight mb-6">
            <span className="block text-white">Domine o</span>
            <span className="block text-gradient">ENEM de vez.</span>
          </h1>

          <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Banco com <strong className="text-white">5.000+ questões</strong> do ENEM e vestibulares,
            separadas por disciplina. Toda semana: o <strong className="text-white">Enem do Emman</strong> —
            uma prova completa pra você testar o nível.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/registro"
              className="btn-primary px-8 py-4 text-base w-full sm:w-auto"
              style={{ boxShadow: '0 0 32px rgba(92,92,255,0.4)' }}>
              Criar conta grátis
              <ArrowRight size={18} />
            </Link>
            <Link href="/auth/login" className="btn-ghost px-8 py-4 text-base w-full sm:w-auto">
              Já tenho conta
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20">
            {STATS.map((s) => (
              <div key={s.label} className="card p-5 text-center">
                <div className="text-2xl md:text-3xl font-black text-gradient mb-1">{s.value}</div>
                <div className="text-xs text-[var(--text-muted)]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enem do Emman Section */}
      <section id="enem-emman" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="card p-8 md:p-12 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.06]"
              style={{ background: 'radial-gradient(ellipse at 20% 50%, #fbbf24, transparent 60%)' }} />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl" style={{ background: 'rgba(251,191,36,0.15)' }}>
                  <Trophy size={24} className="text-[#fbbf24]" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#fbbf24] uppercase tracking-widest mb-1">
                    Toda semana
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-white">
                    Enem do Emman
                  </h2>
                </div>
              </div>
              <p className="text-[var(--text-secondary)] text-lg leading-relaxed max-w-2xl mb-8">
                Uma prova semanal completa montada com questões do ENEM e outros vestibulares.
                Dois cadernos: <span className="text-white font-semibold">Ciências Humanas</span> e{' '}
                <span className="text-white font-semibold">Ciências Exatas</span>.
                Ranking, gabarito comentado e evolução semana a semana.
              </p>
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {[
                  { icon: '📖', title: 'Humanas', desc: 'História, Geo, Filosofia, Sociologia' },
                  { icon: '🔬', title: 'Exatas', desc: 'Mat, Física, Química, Biologia' },
                  { icon: '📊', title: 'Ranking', desc: 'Compare com outros estudantes' },
                ].map(f => (
                  <div key={f.title} className="p-4 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-2xl mb-2">{f.icon}</div>
                    <div className="font-semibold text-white text-sm mb-1">{f.title}</div>
                    <div className="text-xs text-[var(--text-muted)]">{f.desc}</div>
                  </div>
                ))}
              </div>
              <Link href="/auth/registro" className="btn-primary inline-flex">
                Participar desta semana <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Áreas */}
      <section id="areas" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              13 disciplinas, <span className="text-gradient">zero desculpa</span>
            </h2>
            <p className="text-[var(--text-secondary)]">Questões organizadas por matéria para você focar no que precisa</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {AREAS.map((a) => (
              <Link key={a.name} href="/auth/registro"
                className="card-hover p-5 group flex flex-col items-center text-center">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {a.icon}
                </div>
                <div className="text-sm font-semibold text-white">{a.name}</div>
                <div className="mt-3 w-6 h-0.5 rounded-full transition-all duration-300 group-hover:w-12"
                  style={{ background: a.color }} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Target size={24} />, title: 'Foco no ENEM', desc: 'Questões desde 2011. Gabarito oficial + resolução comentada para cada questão.' },
              { icon: <Star size={24} />, title: 'Progresso real', desc: 'Acompanhe sua evolução por matéria. Veja onde você precisa melhorar.' },
              { icon: <BookOpen size={24} />, title: 'Vários vestibulares', desc: 'ENEM, UVA, UECE, FUVEST, UNICAMP e mais. Tudo em um só lugar.' },
            ].map(f => (
              <div key={f.title} className="card-hover p-6">
                <div className="p-3 rounded-xl w-fit mb-4"
                  style={{ background: 'rgba(92,92,255,0.12)', color: '#a3a3ff' }}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
            Sua aprovação começa <span className="text-gradient">agora</span>
          </h2>
          <p className="text-[var(--text-secondary)] text-lg mb-10">
            Crie sua conta grátis e comece a praticar hoje mesmo.
          </p>
          <Link href="/auth/registro"
            className="btn-primary px-10 py-5 text-lg"
            style={{ boxShadow: '0 0 48px rgba(92,92,255,0.35)' }}>
            Criar conta grátis
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <span className="font-bold text-white">Emman Questões</span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} Emman. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}