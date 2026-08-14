import { Glow } from "@/components/Glow"

/**
 * Halo ambiental de la parte de arriba del landing.
 *
 * Va montado en la página y no dentro del hero a propósito: el header es
 * hermano del hero y está antes en el flujo, así que un halo que arranque en el
 * borde del hero se corta justo debajo de la barra y deja una línea horizontal.
 * Anclado al tope de la página, el degradado pasa por detrás del nav —que es una
 * píldora traslúcida, no una barra opaca— y se lee continuo.
 *
 * El color vive en las esquinas de arriba y el centro queda blanco: el título es
 * lo que tiene que resaltar, y sobre un fondo teñido parejo pierde contraste.
 */
export function TopBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0">
      {/* Tiñe el borde superior y se apaga detrás del nav. */}
      <Glow className="left-1/2 top-[-32rem] h-[34rem] w-[64rem] -translate-x-1/2 bg-violet-400/20" />
      {/* Más chicos en mobile: a ancho completo los dos se solapan en el medio y
          vuelven a teñir el título, que es justo lo que se busca evitar. */}
      <Glow className="left-[-18rem] top-[-20rem] h-[26rem] w-[26rem] bg-violet-500/35 lg:h-[34rem] lg:w-[34rem]" />
      <Glow className="right-[-18rem] top-[-20rem] h-[26rem] w-[26rem] bg-fuchsia-400/25 lg:h-[34rem] lg:w-[34rem]" />
    </div>
  )
}
