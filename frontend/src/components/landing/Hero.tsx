import { motion, useMotionValue, useTransform } from 'framer-motion'
import { ArrowRight, ChevronRight, Sparkles } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { STATS } from '../../lib/constants'
import { fadeUp, stagger } from '../../lib/motion'

function AnimatedCounter({ value, label }: { value: string; label: string }) {
  const numericPart = value.replace(/[^0-9]/g, '')
  const suffix = value.replace(/[0-9]/g, '')
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => `${Math.round(v)}${suffix}`)

  useEffect(() => {
    const target = parseInt(numericPart) || 0
    const controls = import('framer-motion').then(({ animate }) =>
      animate(count, target, { duration: 2, ease: 'easeOut' })
    )
    return () => { controls.then((c) => c.stop()) }
  }, [count, numericPart])

  return (
    <div className="text-center">
      <motion.div className="font-display text-2xl font-bold text-ink">{rounded}</motion.div>
      <div className="mt-1 text-xs text-ink-faint">{label}</div>
    </div>
  )
}

function AppPreview() {
  return (
    <motion.div
      variants={fadeUp}
      custom={5}
      className="relative mx-auto mt-20 max-w-3xl"
    >
      {/* Glow behind */}
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-radar-400/20 via-radar-600/10 to-transparent blur-2xl" />
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-radar-400/30 to-radar-600/10 opacity-60" />

      {/* Browser frame */}
      <div className="relative overflow-hidden rounded-2xl border border-border-strong/60 bg-white shadow-2xl shadow-radar-950/10">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-border bg-surface-alt/80 px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400/70" />
            <div className="h-3 w-3 rounded-full bg-amber-400/70" />
            <div className="h-3 w-3 rounded-full bg-emerald-400/70" />
          </div>
          <div className="mx-auto flex h-7 w-72 items-center justify-center rounded-md bg-white/80 border border-border px-3 text-xs text-ink-faint font-mono">
            app.jobradar.com.br/jobs
          </div>
        </div>

        {/* Fake app content */}
        <div className="grid grid-cols-[220px_1fr] divide-x divide-border">
          {/* Sidebar */}
          <div className="space-y-1 bg-surface-alt/40 p-4">
            {['Dashboard', 'Buscar Vagas', 'Favoritos', 'Candidaturas', 'Alertas'].map((item, i) => (
              <div
                key={item}
                className={`rounded-lg px-3 py-2 text-xs font-medium ${
                  i === 1
                    ? 'bg-radar-50 text-radar-700 border border-radar-200/60'
                    : 'text-ink-muted hover:bg-surface-alt'
                }`}
              >
                {item}
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="p-5 space-y-3">
            {/* Search bar */}
            <div className="flex gap-2">
              <div className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-ink-faint">
                Buscar vagas: "React developer remoto"
              </div>
              <div className="rounded-lg bg-radar-600 px-4 py-2 text-xs font-medium text-white">Buscar</div>
            </div>
            {/* Job cards */}
            {[
              { title: 'Senior React Developer', company: 'Nubank', tag: 'Remoto', salary: 'R$ 18k-25k' },
              { title: 'Full Stack Engineer', company: 'iFood', tag: 'Hibrido', salary: 'R$ 15k-22k' },
              { title: 'Frontend Lead', company: 'Spotify', tag: 'Remoto', salary: 'USD 80k-120k' },
            ].map((job) => (
              <div
                key={job.title}
                className="flex items-center justify-between rounded-xl border border-border p-3.5 transition-all hover:border-radar-200 hover:shadow-sm"
              >
                <div>
                  <div className="text-sm font-semibold text-ink">{job.title}</div>
                  <div className="mt-0.5 text-xs text-ink-muted">{job.company}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-radar-50 px-2.5 py-0.5 text-[10px] font-medium text-radar-700">
                    {job.tag}
                  </span>
                  <span className="text-xs font-medium text-emerald-600">{job.salary}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-8">
      {/* Multi-layered background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />
      <div className="pointer-events-none absolute top-[-200px] left-1/2 h-[800px] w-[1200px] -translate-x-1/2 rounded-full bg-gradient-to-br from-radar-400/10 via-indigo-400/5 to-transparent blur-[100px]" />
      <div className="pointer-events-none absolute top-[100px] right-[-200px] h-[400px] w-[400px] rounded-full bg-radar-300/8 blur-[80px] animate-pulse-soft" />
      <div className="pointer-events-none absolute bottom-[100px] left-[-150px] h-[300px] w-[300px] rounded-full bg-indigo-300/6 blur-[80px] animate-pulse-soft" style={{ animationDelay: '2s' }} />

      <motion.div
        className="relative mx-auto max-w-5xl px-6 text-center"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.div
          variants={fadeUp}
          custom={0}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-radar-200/60 bg-white px-4 py-1.5 text-sm text-ink-muted shadow-sm glow-sm"
        >
          <Sparkles size={14} className="text-radar-500" />
          <span>Busca inteligente de vagas no Brasil e no mundo</span>
          <ChevronRight size={12} className="text-ink-faint" />
        </motion.div>

        <motion.h1
          variants={fadeUp}
          custom={1}
          className="font-display text-[4rem] leading-[1.05] font-bold tracking-[-0.04em] text-ink"
        >
          Sua proxima oportunidade
          <br />
          <span className="text-gradient">esta a um clique.</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          custom={2}
          className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-ink-muted"
        >
          O JobRadar agrega vagas de <strong className="text-ink font-medium">multiplas plataformas</strong>,
          personaliza resultados com base no seu perfil e acompanha suas candidaturas
          — tudo em uma interface pensada para quem quer <strong className="text-ink font-medium">ir mais longe</strong>.
        </motion.p>

        <motion.div variants={fadeUp} custom={3} className="mt-10 flex items-center justify-center gap-4">
          <Link
            to="/register"
            className="group flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-radar-600 to-radar-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-radar-600/25 transition-all hover:shadow-xl hover:shadow-radar-600/35 hover:brightness-110"
          >
            Comecar gratis
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="#features"
            className="flex items-center gap-1.5 rounded-xl border border-border px-7 py-3.5 text-sm font-medium text-ink-muted transition-all hover:border-border-strong hover:text-ink hover:bg-white"
          >
            Ver funcionalidades
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={fadeUp}
          custom={4}
          className="mx-auto mt-14 grid max-w-md grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-white/80 backdrop-blur-sm p-6 shadow-sm"
        >
          {STATS.map((stat) => (
            <AnimatedCounter key={stat.label} value={stat.value} label={stat.label} />
          ))}
        </motion.div>

        {/* App Preview */}
        <AppPreview />
      </motion.div>
    </section>
  )
}
