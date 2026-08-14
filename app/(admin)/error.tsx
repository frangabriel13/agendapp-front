"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCw } from "lucide-react"

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
    <div className="p-6">
      <div className="max-w-lg bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-gray-900">No pudimos cargar esta sección</h2>
            <p className="text-sm text-gray-500 mt-1">
              Puede ser una caída momentánea. Reintentá; si sigue fallando, cerrá sesión y volvé a
              entrar.
            </p>

            {process.env.NODE_ENV === "development" && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md p-3 mt-4 font-mono break-words">
                {error.message}
              </p>
            )}

            <button
              onClick={reset}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-sm bg-violet-600 text-white rounded-md font-semibold hover:bg-violet-500 transition-colors cursor-pointer"
            >
              <RotateCw size={15} />
              Reintentar
            </button>

            {error.digest && (
              <p className="text-xs text-gray-400 mt-4">
                Código de error: <span className="font-mono">{error.digest}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
