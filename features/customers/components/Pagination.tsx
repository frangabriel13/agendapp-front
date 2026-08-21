"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { pageRange, pageWindow, type PageMeta } from "@/lib/pagination"

interface Props {
  meta: PageMeta
  onChange: (page: number) => void
}

/**
 * La barra de páginas.
 *
 * Vive en `features/customers` porque es la primera pantalla paginada, pero
 * **no depende de clientes**: recibe el `meta` que devuelve cualquier endpoint
 * paginado. Cuando el historial de turnos y el de pagos la necesiten, se sube a
 * `components/` sin tocarle nada.
 */
export function Pagination({ meta, onChange }: Props) {
  const tokens = pageWindow(meta.page, meta.totalPages)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] px-5 py-3">
      <p className="text-xs text-neutral-500">{pageRange(meta)}</p>

      {meta.totalPages > 1 && (
        <nav aria-label="Paginación" className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChange(meta.page - 1)}
            disabled={meta.page <= 1}
            aria-label="Página anterior"
            className={flecha}
          >
            <ChevronLeft size={15} />
          </button>

          {tokens.map((token, index) =>
            token === "…" ? (
              // El separador no es un botón: no lleva a ningún lado.
              <span
                key={`salto-${index}`}
                aria-hidden
                className="px-1 text-xs text-neutral-400"
              >
                …
              </span>
            ) : (
              <button
                key={token}
                type="button"
                onClick={() => onChange(token)}
                aria-label={`Página ${token}`}
                aria-current={token === meta.page ? "page" : undefined}
                className={cn(
                  "min-w-8 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                  token === meta.page
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
                )}
              >
                {token}
              </button>
            ),
          )}

          <button
            type="button"
            onClick={() => onChange(meta.page + 1)}
            disabled={meta.page >= meta.totalPages}
            aria-label="Página siguiente"
            className={flecha}
          >
            <ChevronRight size={15} />
          </button>
        </nav>
      )}
    </div>
  )
}

const flecha = cn(
  "rounded-lg p-1.5 text-neutral-500 transition-colors",
  "hover:bg-neutral-100 hover:text-neutral-900",
  "disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent",
)
