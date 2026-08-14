import { Glow } from "./Glow"

/**
 * Halo ambiental de la parte de arriba del landing.
 *
 * Va montado en la página y no dentro del hero a propósito: el header es
 * hermano del hero y está antes en el flujo, así que un halo que arranque en el
 * borde del hero se corta justo debajo de la barra y deja una línea horizontal.
 * Anclado al tope de la página, el degradado pasa por detrás del nav —que es una
 * píldora traslúcida, no una barra opaca— y se lee continuo.
 *
 * Los halos laterales son más intensos que el central para dejar el título sobre
 * fondo claro y que el color quede en las esquinas.
 */
export function TopBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0">
      <Glow className="left-1/2 top-[-18rem] h-[32rem] w-[70rem] -translate-x-1/2 bg-violet-400/20" />
      <Glow className="left-[-10rem] top-[-14rem] h-[30rem] w-[34rem] bg-violet-500/30" />
      <Glow className="right-[-10rem] top-[-14rem] h-[30rem] w-[34rem] bg-violet-500/25" />
      <Glow className="left-1/2 top-[-6rem] h-[24rem] w-[28rem] -translate-x-1/2 bg-fuchsia-400/15" />
    </div>
  )
}
