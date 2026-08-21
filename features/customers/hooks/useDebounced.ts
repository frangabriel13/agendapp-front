"use client"

import { useEffect, useState } from "react"

/**
 * El valor, pero recién después de que dejaron de escribir.
 *
 * La búsqueda de clientes cruza cuatro campos del lado del backend: mandar una
 * request por tecla es una consulta pesada por letra y respuestas que llegan
 * desordenadas —lo que se ve depende de cuál tardó menos—. Con esto sale una
 * sola cuando la persona frena.
 *
 * El `setState` va dentro de un `setTimeout`, no en el cuerpo del efecto: es una
 * suscripción a un sistema externo (el reloj), que es exactamente para lo que
 * están los efectos.
 */
export function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(timeout)
  }, [value, ms])

  return debounced
}
