import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fadeUp, stagger } from '../../lib/motion'

export default function CTA() {
  return (
    <section className="relative overflow-hidden border-t border-border bg-radar-950 py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-radar-500/15 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[300px] translate-x-1/4 translate-y-1/4 rounded-full bg-indigo-500/10 blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <motion.div
        className="relative mx-auto max-w-2xl px-6 text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
      >
        <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold tracking-wide text-radar-400 uppercase">
          Comece agora
        </motion.p>
        <motion.h2
          variants={fadeUp}
          custom={1}
          className="mt-5 font-display text-4xl font-bold tracking-tight text-white leading-tight"
        >
          O proximo capitulo da sua
          <br />
          carreira comeca aqui.
        </motion.h2>
        <motion.p variants={fadeUp} custom={2} className="mt-5 text-lg text-radar-200/70 leading-relaxed">
          Milhares de vagas atualizadas. Alertas personalizados.
          <br />
          Tracking de candidaturas. Tudo gratis.
        </motion.p>
        <motion.div variants={fadeUp} custom={3} className="mt-10">
          <Link
            to="/register"
            className="group inline-flex items-center gap-2.5 rounded-xl bg-white px-8 py-4 text-sm font-bold text-radar-950 shadow-xl shadow-black/20 transition-all hover:bg-radar-50 hover:shadow-2xl hover:scale-[1.02]"
          >
            Criar conta gratis
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
        <motion.p variants={fadeUp} custom={4} className="mt-6 text-xs text-radar-300/50">
          Sem cartao de credito. Sem compromisso. Cancele quando quiser.
        </motion.p>
      </motion.div>
    </section>
  )
}
