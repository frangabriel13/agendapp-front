import { Glow } from "@/components/Glow"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    // Mismo tratamiento que el landing: halo violeta sobre blanco. `isolate` lo
    // mantiene por encima del fondo y `overflow-x-clip` evita el scroll lateral
    // que arrastraría en mobile por ser más ancho que la pantalla.
    // `text-neutral-900` explícito, igual que el landing: sin esto se hereda el
    // `--foreground` de shadcn, que es más oscuro, y los textos sin clase de color
    // quedan de un negro distinto al del resto del sitio.
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-x-clip bg-white px-4 py-12 text-neutral-900 antialiased">
      {/* Concentrado detrás de la tarjeta y no a toda la página: es lo que le da
          el contraste al blanco de la tarjeta. Estirado hasta los bordes, tiñe
          todo parejo y la tarjeta desaparece dentro del fondo. */}
      <Glow className="left-1/2 top-1/2 h-[26rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 bg-violet-500/30" />
      <Glow className="left-1/2 top-[-8rem] h-[20rem] w-[26rem] -translate-x-1/2 bg-fuchsia-400/20" />
      {children}
    </div>
  )
}
