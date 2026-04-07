import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fadeUp, stagger } from '../lib/motion'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="text-center"
      >
        <motion.p
          variants={fadeUp}
          custom={0}
          className="font-display text-8xl font-bold tracking-tight text-ink"
        >
          404
        </motion.p>
        <motion.p
          variants={fadeUp}
          custom={1}
          className="mt-4 text-lg text-ink-muted"
        >
          Pagina nao encontrada
        </motion.p>
        <motion.div variants={fadeUp} custom={2} className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-radar-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-radar-700 no-underline"
          >
            <ArrowLeft size={16} />
            Voltar ao inicio
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}
