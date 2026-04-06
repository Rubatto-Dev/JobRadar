import { motion } from 'framer-motion'
import { LogIn, Settings, Send, BarChart3 } from 'lucide-react'
import { STEPS } from '../../lib/constants'
import { fadeUp, stagger } from '../../lib/motion'

const STEP_ICONS = [LogIn, Settings, Send, BarChart3]

export default function HowItWorks() {
  return (
    <section className="relative border-t border-border py-28 bg-surface-alt/50">
      <motion.div
        className="mx-auto max-w-5xl px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={stagger}
      >
        <motion.div variants={fadeUp} custom={0} className="text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-radar-50 px-3 py-1 text-xs font-semibold tracking-wide text-radar-600 uppercase">
            Como funciona
          </p>
          <h2 className="mt-5 font-display text-4xl font-bold tracking-tight text-ink">
            De zero a contratado em <span className="text-gradient">4 passos</span>
          </h2>
        </motion.div>

        <div className="relative mt-20">
          {/* Connecting line */}
          <div className="absolute top-12 left-0 right-0 hidden h-px bg-gradient-to-r from-transparent via-border-strong to-transparent md:block" />

          <div className="grid gap-8 md:grid-cols-4 md:gap-0">
            {STEPS.map((item, i) => {
              const Icon = STEP_ICONS[i]
              return (
                <motion.div
                  key={item.step}
                  variants={fadeUp}
                  custom={i + 1}
                  className="relative px-4 text-center"
                >
                  <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-radar-500 to-radar-700 text-white shadow-lg shadow-radar-600/20">
                    <Icon size={20} />
                  </div>
                  <div className="mt-1.5 font-mono text-[10px] font-bold text-radar-400 tracking-widest uppercase">
                    Passo {item.step}
                  </div>
                  <h3 className="mt-3 font-display text-base font-semibold text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
