import { Radar } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Left panel - branding */}
      <div className="relative hidden w-[480px] flex-shrink-0 overflow-hidden bg-radar-950 lg:flex lg:flex-col lg:justify-between p-10">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-100px] left-[-100px] h-[400px] w-[400px] rounded-full bg-radar-500/15 blur-[100px]" />
          <div className="absolute bottom-[-50px] right-[-50px] h-[300px] w-[300px] rounded-full bg-indigo-500/10 blur-[80px]" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        <div className="relative">
          <Link to="/" className="flex items-center gap-2.5 font-display text-xl font-semibold text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
              <Radar size={18} className="text-radar-300" />
            </div>
            JobRadar
          </Link>
        </div>

        <div className="relative space-y-6">
          <h2 className="font-display text-3xl font-bold leading-tight text-white">
            Encontre vagas que
            <br />
            <span className="text-radar-300">combinam com voce.</span>
          </h2>
          <p className="text-sm leading-relaxed text-radar-200/60">
            Centralizamos vagas de multiplas plataformas, filtramos com base nas suas preferencias
            e acompanhamos suas candidaturas em um so lugar.
          </p>

          {/* Social proof */}
          <div className="flex items-center gap-3 pt-4">
            <div className="flex -space-x-2">
              {['bg-radar-400', 'bg-emerald-400', 'bg-amber-400', 'bg-rose-400'].map((color, i) => (
                <div
                  key={i}
                  className={`h-8 w-8 rounded-full ${color} border-2 border-radar-950 flex items-center justify-center text-[10px] font-bold text-white`}
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <p className="text-xs text-radar-200/50">
              Junte-se a quem ja encontrou a vaga certa
            </p>
          </div>
        </div>

        <p className="relative text-xs text-radar-300/30">
          2026 JobRadar by rubatto-dev
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
