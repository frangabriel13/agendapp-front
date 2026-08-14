"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RotateCw } from "lucide-react"

export default function Error({
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={22} />
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">Algo salió mal</h1>
        <p className="text-sm text-gray-500 mb-6">
          No pudimos cargar esta página. Podés reintentar o volver al inicio.
        </p>

        {/* En producción Next reemplaza el mensaje por uno genérico y deja el digest. */}
        {process.env.NODE_ENV === "development" && (
          <p className="text-xs text-left text-red-600 bg-red-50 border border-red-100 rounded-md p-3 mb-6 font-mono break-words">
            {error.message}
          </p>
        )}

        <div className="flex justify-center gap-2">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-violet-600 text-white rounded-md font-semibold hover:bg-violet-500 transition-colors cursor-pointer"
          >
            <RotateCw size={15} />
            Reintentar
          </button>
          <Link
            href="/"
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            Ir al inicio
          </Link>
        </div>

        {error.digest && (
          <p className="text-xs text-gray-400 mt-6">
            Código de error: <span className="font-mono">{error.digest}</span>
          </p>
        )}
      </div>
    </div>
  )
}
