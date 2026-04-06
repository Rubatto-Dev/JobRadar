import { motion } from 'framer-motion'
import { STEPS } from '../../lib/constants'
import { fadeUp, stagger } from '../../lib/motion'

export default function HowItWorks() {
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
          {STEPS.map((item, i) => (
            <motion.div key={item.step} variants={fadeUp} custom={i + 1} className="relative px-4 text-center">
              {i < STEPS.length - 1 && (
                <div
                  className="absolute top-5 right-0 hidden h-px w-full bg-border md:block"
                  style={{ left: '60%', width: '80%' }}
                />
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
