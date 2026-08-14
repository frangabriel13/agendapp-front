"use client"

import { cta } from "@/components/CtaLink"
import { cn } from "@/lib/utils"

interface Props {
  title: string
  description: string
  /** `false` para quien solo puede mirar: se ocultan los controles de guardado. */
  canSave: boolean
  saving: boolean
  /** Mensaje que impide guardar; también deshabilita el botón. */
  problem?: string | null
  onSave: () => void
  children: React.ReactNode
}

/** Cascarón de cada bloque de configuración: título, campos y su propio guardado. */
export function SettingsCard({ title, description, canSave, saving, problem, onSave, children }: Props) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave()
      }}
      className="rounded-2xl border border-black/[0.07] bg-white"
    >
      <div className="border-b border-black/[0.06] px-6 py-5">
        <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900">{title}</h2>
        <p className="mt-1 text-[13px] text-neutral-500">{description}</p>
      </div>

      <div className="space-y-4 px-6 py-5">{children}</div>

      {canSave && (
        <div className="flex items-center justify-end gap-3 border-t border-black/[0.06] px-6 py-4">
          {problem && <p className="mr-auto text-[13px] text-red-600">{problem}</p>}
          <button type="submit" disabled={saving || Boolean(problem)} className={cn(cta({ size: "sm" }))}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      )}
    </form>
  )
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-neutral-700">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-neutral-400">{hint}</p>}
    </div>
  )
}
