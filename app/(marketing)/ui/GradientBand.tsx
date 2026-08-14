import { Glow } from "./Glow"

/**
 * Banda de color que atraviesa un tramo de secciones.
 *
 * El degradado vertical nace transparente, llega a su punto más fuerte en el
 * medio y vuelve a apagarse, así que arranca y termina en los bordes del tramo
 * sin dejar corte. Envuelve a las secciones en vez de meter un halo en cada una:
 * el alto se calcula solo con el contenido y no quedan costuras en los límites.
 *
 * Las secciones que envuelva no pueden ir en `muted`: ese fondo es opaco, se
 * pinta por encima de la banda y la taparía.
 */
export function GradientBand({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-transparent via-violet-500/12 to-transparent"
      />
      {/* Refuerzan el pico desde los costados, centrados en el alto de la banda. */}
      <Glow className="left-[-12rem] top-1/2 h-[32rem] w-[36rem] -translate-y-1/2 bg-violet-500/20" />
      <Glow className="right-[-12rem] top-1/2 h-[32rem] w-[36rem] -translate-y-1/2 bg-fuchsia-400/15" />
      {children}
    </div>
  )
}
