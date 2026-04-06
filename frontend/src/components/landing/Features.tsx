import { motion } from 'framer-motion'
import { FEATURES } from '../../lib/constants'
import { fadeUp, stagger } from '../../lib/motion'

export default function Features() {
  return (
    <section id="features" className="relative border-t border-border bg-white py-28">
      {/* Subtle accent */}
      <div className="pointer-events-none absolute top-0 left-1/2 h-px w-1/2 -translate-x-1/2 bg-gradient-to-r from-transparent via-radar-400/40 to-transparent" />

      <motion.div
        className="mx-auto max-w-6xl px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={stagger}
      >
        <motion.div variants={fadeUp} custom={0} className="text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-radar-50 px-3 py-1 text-xs font-semibold tracking-wide text-radar-600 uppercase">
            Funcionalidades
          </p>
          <h2 className="mt-5 font-display text-4xl font-bold tracking-tight text-ink">
            Tudo que voce precisa para
            <br />
            <span className="text-gradient">encontrar a vaga ideal</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-ink-muted leading-relaxed">
            Chega de abrir 10 abas por dia. O JobRadar centraliza, filtra e organiza a sua busca
            para voce focar no que importa: a sua carreira.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              variants={fadeUp}
              custom={i + 1}
              className="group relative overflow-hidden rounded-2xl border border-border bg-white p-7 transition-all duration-300 hover:border-radar-200 hover:shadow-lg hover:shadow-radar-950/[0.04] hover:-translate-y-0.5"
            >
              {/* Hover gradient */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-radar-50/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative">
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${feature.color} transition-transform duration-300 group-hover:scale-110`}>
                  <feature.icon size={20} />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-ink">{feature.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
