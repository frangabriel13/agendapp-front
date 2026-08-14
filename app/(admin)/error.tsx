"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCw } from "lucide-react"
import { cta } from "@/components/CtaLink"
import { cn } from "@/lib/utils"

/** Atrapa fallos de las páginas del panel. El sidebar del layout sigue en pie. */
export default function AdminError({
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
    <div className="p-5 sm:p-8">
      <div className="max-w-lg rounded-2xl border border-black/[0.07] bg-white p-6">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500"
          >
            <AlertTriangle size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900">
              No pudimos cargar esta sección
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">
              Puede ser una caída momentánea. Reintentá; si sigue fallando, cerrá sesión y volvé a entrar.
            </p>

            {/* En producción Next reemplaza el mensaje por uno genérico y deja el digest. */}
            {process.env.NODE_ENV === "development" && (
              <p className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 font-mono text-xs break-words text-red-600">
                {error.message}
              </p>
            )}

            <button onClick={reset} className={cn(cta({ size: "sm" }), "mt-5")}>
              <RotateCw size={15} />
              Reintentar
            </button>

            {error.digest && (
              <p className="mt-5 text-xs text-neutral-400">
                Código de error: <span className="font-mono">{error.digest}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
