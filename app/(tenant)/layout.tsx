import { Glow } from "@/components/Glow"

/**
 * Las pantallas que abre **el cliente del negocio**, no el panel.
 *
 * Hoy son las tres vueltas del checkout de Mercado Pago, y mañana el portal
 * público de reservas. Mismo tratamiento visual que las de sesión —halo violeta
 * sobre blanco— pero sin nada que empuje a iniciar sesión: quien llega acá no
 * tiene cuenta ni la va a tener.
 */
export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-x-clip bg-white px-4 py-12 text-neutral-900 antialiased">
      <Glow className="left-1/2 top-1/2 h-[26rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 bg-violet-500/30" />
      <Glow className="left-1/2 top-[-8rem] h-[20rem] w-[26rem] -translate-x-1/2 bg-fuchsia-400/20" />
      {children}
    </div>
  )
}
