import { motion } from 'framer-motion'
import { ArrowRight, ChevronRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { STATS } from '../../lib/constants'
import { fadeUp, stagger } from '../../lib/motion'

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M0 0h60v60H0z' stroke='%23000' stroke-width='.5'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="pointer-events-none absolute top-0 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-radar-400/8 blur-[120px]" />

      <motion.div
        className="relative mx-auto max-w-4xl px-6 text-center"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.div
          variants={fadeUp}
          custom={0}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-1.5 text-sm text-ink-muted shadow-sm"
        >
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
          O JobRadar agrega vagas de multiplas plataformas, personaliza resultados com base no seu perfil e
          acompanha suas candidaturas — tudo em uma interface limpa e rapida.
        </motion.p>

        <motion.div variants={fadeUp} custom={3} className="mt-10 flex items-center justify-center gap-4">
          <Link
            to="/register"
            className="group flex items-center gap-2 rounded-xl bg-radar-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-radar-600/25 transition-all hover:bg-radar-700 hover:shadow-xl hover:shadow-radar-600/30"
          >
            Comecar agora
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#features"
            className="flex items-center gap-1.5 rounded-xl border border-border px-6 py-3 text-sm font-medium text-ink-muted transition-all hover:border-border-strong hover:text-ink"
          >
            Como funciona
            <ChevronRight size={14} />
          </a>
        </motion.div>

        <motion.div
          variants={fadeUp}
          custom={4}
          className="mx-auto mt-16 grid max-w-lg grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-white p-6 shadow-sm"
        >
          {STATS.map((stat) => (
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
