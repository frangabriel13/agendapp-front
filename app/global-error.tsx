"use client"

import { useEffect } from "react"
import { cn } from "@/lib/utils"
import { cta } from "@/components/CtaLink"
// `global-error` reemplaza al layout raíz entero, así que el CSS que este importa
// no llega hasta acá: hay que traerlo de nuevo o la pantalla sale sin estilos.
import "./globals.css"

/**
 * Última red de contención: se muestra cuando el error revienta en el layout
 * raíz, donde `app/error.tsx` ya no puede renderizar. Por eso define su propio
 * `<html>` y `<body>`.
 *
 * Sin este archivo, ese caso termina en la pantalla en blanco de Next.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    // La familia tipográfica va inline porque la variable de la fuente la define
    // el layout raíz, que en este punto no se montó.
    <html lang="es" style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
      <body className="flex min-h-screen items-center justify-center bg-white px-4 antialiased">
        <div className="w-full max-w-md rounded-2xl border border-black/[0.08] bg-white p-8 text-center shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">Algo salió mal</h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            La aplicación no pudo cargar. Probá recargar; si sigue pasando, escribinos.
          </p>

          {/* En producción Next reemplaza el mensaje por uno genérico y deja el digest. */}
          {process.env.NODE_ENV === "development" && (
            <p className="mt-6 rounded-xl border border-red-100 bg-red-50 p-3 text-left font-mono text-xs break-words text-red-600">
              {error.message}
            </p>
          )}

          <button
            onClick={reset}
            className={cn(cta({ block: true }), "mt-7")}
          >
            Reintentar
          </button>

          {error.digest && (
            <p className="mt-6 text-xs text-neutral-400">
              Código de error: <span className="font-mono">{error.digest}</span>
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
