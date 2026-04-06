import { motion } from 'framer-motion'
import {
  ArrowRight,
  Bell,
  Briefcase,
  ChevronRight,
  Globe,
  Radar,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
}

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
}

function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border/60 bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="/" className="flex items-center gap-2.5 font-display text-xl font-semibold tracking-tight text-ink">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-radar-600 text-white">
            <Radar size={18} strokeWidth={2.5} />
          </div>
          JobRadar
        </a>
        <div className="flex items-center gap-3">
          <a
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            Entrar
          </a>
          <a
            href="/register"
            className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition-all hover:bg-ink/90"
          >
            Criar conta
          </a>
        </div>
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20">
      {/* Subtle grid bg */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M0 0h60v60H0z' stroke='%23000' stroke-width='.5'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      {/* Gradient glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-radar-400/8 blur-[120px]" />

      <motion.div
        className="relative mx-auto max-w-4xl px-6 text-center"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.div variants={fadeUp} custom={0} className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-1.5 text-sm text-ink-muted shadow-sm">
          <Sparkles size={14} className="text-radar-500" />
          Busca inteligente de vagas no Brasil e no mundo
        </motion.div>

        <motion.h1
          variants={fadeUp}
          custom={1}
          className="font-display text-[3.5rem] leading-[1.08] font-bold tracking-[-0.035em] text-ink"
        >
          Todas as vagas.
          <br />
          <span className="text-radar-600">Um so lugar.</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          custom={2}
          className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-muted"
        >
          O JobRadar agrega vagas de multiplas plataformas, personaliza resultados
          com base no seu perfil e acompanha suas candidaturas — tudo em uma interface limpa e rapida.
        </motion.p>

        <motion.div variants={fadeUp} custom={3} className="mt-10 flex items-center justify-center gap-4">
          <a
            href="/register"
            className="group flex items-center gap-2 rounded-xl bg-radar-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-radar-600/25 transition-all hover:bg-radar-700 hover:shadow-xl hover:shadow-radar-600/30"
          >
            Comecar agora
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </a>
          <a
            href="#features"
            className="flex items-center gap-1.5 rounded-xl border border-border px-6 py-3 text-sm font-medium text-ink-muted transition-all hover:border-border-strong hover:text-ink"
          >
            Como funciona
            <ChevronRight size={14} />
          </a>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          variants={fadeUp}
          custom={4}
          className="mx-auto mt-16 grid max-w-lg grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-white p-6 shadow-sm"
        >
          {[
            { value: '50k+', label: 'Vagas agregadas' },
            { value: '2', label: 'Fontes integradas' },
            { value: '< 2h', label: 'Atualizacao' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-2xl font-bold text-ink">{stat.value}</div>
              <div className="mt-1 text-xs text-ink-faint">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}

const features = [
  {
    icon: Search,
    title: 'Busca unificada',
    description: 'Gupy, Remotive e mais fontes em uma unica busca com filtros avancados por modalidade, senioridade e salario.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Target,
    title: 'Personalizacao',
    description: 'Configure suas preferencias e receba vagas que realmente combinam com seu perfil e objetivos.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Bell,
    title: 'Alertas inteligentes',
    description: 'Receba notificacoes por email quando novas vagas compatveis com seu perfil forem encontradas.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Briefcase,
    title: 'Tracking de candidaturas',
    description: 'Acompanhe o status de cada candidatura: aplicado, entrevista, aprovado. Tudo organizado.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Globe,
    title: 'Brasil e remoto global',
    description: 'Vagas presenciais no Brasil e oportunidades remotas em empresas do mundo inteiro.',
    color: 'bg-rose-50 text-rose-600',
  },
  {
    icon: Zap,
    title: 'Rapido e leve',
    description: 'Interface minimalista, busca instantanea e zero distracao. Foco total em encontrar sua proxima vaga.',
    color: 'bg-cyan-50 text-cyan-600',
  },
]

function Features() {
  return (
    <section id="features" className="border-t border-border bg-white py-24">
      <motion.div
        className="mx-auto max-w-6xl px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={stagger}
      >
        <motion.div variants={fadeUp} custom={0} className="text-center">
          <p className="text-sm font-semibold tracking-wide text-radar-600 uppercase">Funcionalidades</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
            Tudo que voce precisa para encontrar a vaga ideal
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-muted">
            Chega de abrir 10 abas por dia. O JobRadar centraliza, filtra e organiza a sua busca.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              variants={fadeUp}
              custom={i + 1}
              className="group rounded-2xl border border-border p-6 transition-all hover:border-border-strong hover:shadow-sm"
            >
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${feature.color}`}>
                <feature.icon size={20} />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

const steps = [
  {
    step: '01',
    title: 'Crie sua conta',
    description: 'Cadastro rapido com email ou Google. Sem cartao de credito.',
  },
  {
    step: '02',
    title: 'Configure preferencias',
    description: 'Defina modalidade, area, senioridade e faixa salarial desejada.',
  },
  {
    step: '03',
    title: 'Receba vagas filtradas',
    description: 'O JobRadar coleta, normaliza e entrega vagas relevantes para voce.',
  },
  {
    step: '04',
    title: 'Acompanhe candidaturas',
    description: 'Favorite vagas, registre candidaturas e monitore o progresso.',
  },
]

function HowItWorks() {
  return (
    <section className="border-t border-border py-24">
      <motion.div
        className="mx-auto max-w-4xl px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={stagger}
      >
        <motion.div variants={fadeUp} custom={0} className="text-center">
          <p className="text-sm font-semibold tracking-wide text-radar-600 uppercase">Como funciona</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
            4 passos para acelerar sua busca
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-0 md:grid-cols-4">
          {steps.map((item, i) => (
            <motion.div key={item.step} variants={fadeUp} custom={i + 1} className="relative px-4 text-center">
              {i < steps.length - 1 && (
                <div className="absolute top-5 right-0 hidden h-px w-full bg-border md:block" style={{ left: '60%', width: '80%' }} />
              )}
              <div className="relative mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-radar-600 font-mono text-xs font-bold text-white">
                {item.step}
              </div>
              <h3 className="mt-4 font-display text-base font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

function CTA() {
  return (
    <section className="border-t border-border bg-ink py-24">
      <motion.div
        className="mx-auto max-w-2xl px-6 text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
      >
        <motion.div variants={fadeUp} custom={0}>
          <TrendingUp size={32} className="mx-auto text-radar-400" />
        </motion.div>
        <motion.h2 variants={fadeUp} custom={1} className="mt-6 font-display text-3xl font-bold tracking-tight text-white">
          Pare de perder tempo buscando vagas
        </motion.h2>
        <motion.p variants={fadeUp} custom={2} className="mt-4 text-ink-faint">
          Junte-se a quem ja encontrou a vaga certa com menos esforco.
          Gratis para comecar.
        </motion.p>
        <motion.div variants={fadeUp} custom={3} className="mt-8">
          <a
            href="/register"
            className="group inline-flex items-center gap-2 rounded-xl bg-radar-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-radar-500/30 transition-all hover:bg-radar-400 hover:shadow-xl"
          >
            Criar conta gratis
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </a>
        </motion.div>
      </motion.div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm text-ink-faint">
        <div className="flex items-center gap-2">
          <Radar size={16} className="text-ink-muted" />
          <span>JobRadar</span>
        </div>
        <p>2026 rubatto-dev. Feito com proprosito.</p>
      </div>
    </footer>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  )
}
