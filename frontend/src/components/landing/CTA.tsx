import { motion } from 'framer-motion'
import { ArrowRight, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fadeUp, stagger } from '../../lib/motion'

export default function CTA() {
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
        <motion.h2
          variants={fadeUp}
          custom={1}
          className="mt-6 font-display text-3xl font-bold tracking-tight text-white"
        >
          Pare de perder tempo buscando vagas
        </motion.h2>
        <motion.p variants={fadeUp} custom={2} className="mt-4 text-ink-faint">
          Junte-se a quem ja encontrou a vaga certa com menos esforco. Gratis para comecar.
        </motion.p>
        <motion.div variants={fadeUp} custom={3} className="mt-8">
          <Link
            to="/register"
            className="group inline-flex items-center gap-2 rounded-xl bg-radar-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-radar-500/30 transition-all hover:bg-radar-400 hover:shadow-xl"
          >
            Criar conta gratis
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  )
}
