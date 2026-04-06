import { motion } from 'framer-motion'
import { FEATURES } from '../../lib/constants'
import { fadeUp, stagger } from '../../lib/motion'

export default function Features() {
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
          {FEATURES.map((feature, i) => (
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
