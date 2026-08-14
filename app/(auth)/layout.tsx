import { Glow } from "@/components/Glow"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    // Mismo tratamiento que el landing: halo violeta sobre blanco. `isolate` lo
    // mantiene por encima del fondo y `overflow-x-clip` evita el scroll lateral
    // que arrastraría en mobile por ser más ancho que la pantalla.
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-x-clip bg-white px-4 py-12">
      <Glow className="left-1/2 top-[-14rem] h-[32rem] w-[46rem] -translate-x-1/2 bg-violet-500/25" />
      <Glow className="bottom-[-16rem] left-1/2 h-[28rem] w-[36rem] -translate-x-1/2 bg-fuchsia-400/15" />
      {children}
    </div>
  )
}
