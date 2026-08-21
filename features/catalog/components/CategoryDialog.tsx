"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cta } from "@/components/CtaLink"
import { control } from "@/components/form"
import { cn } from "@/lib/utils"
import type { ServiceCategory } from "@/types"
import { useCreateCategory, useUpdateCategory } from "../hooks/useCatalog"

interface Props {
  category: ServiceCategory | null
  open: boolean
  onClose: () => void
}

export function CategoryDialog({ category, open, onClose }: Props) {
  const editando = category !== null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
          <DialogDescription>Para agrupar el catálogo: Corte, Color, Uñas.</DialogDescription>
        </DialogHeader>

        <CategoryForm key={category?.id ?? "nueva"} category={category} onDone={onClose} />
      </DialogContent>
    </Dialog>
  )
}

function CategoryForm({
  category,
  onDone,
}: {
  category: ServiceCategory | null
  onDone: () => void
}) {
  const [name, setName] = useState(category?.name ?? "")
  const [order, setOrder] = useState(String(category?.displayOrder ?? 0))
  const [error, setError] = useState<string | null>(null)

  const crear = useCreateCategory()
  const actualizar = useUpdateCategory()
  const guardando = crear.isPending || actualizar.isPending

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return setError("Poné un nombre")
    setError(null)

    const payload = { name: name.trim(), displayOrder: Number(order) || 0 }

    if (category) actualizar.mutate({ id: category.id, ...payload }, { onSuccess: onDone })
    else crear.mutate(payload, { onSuccess: onDone })
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <label htmlFor="c-name" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
          Nombre
        </label>
        <input
          id="c-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          autoFocus
          placeholder="Color"
          className={control()}
        />
      </div>

      <div>
        <label htmlFor="c-order" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
          Orden
        </label>
        <input
          id="c-order"
          type="number"
          min={0}
          max={9999}
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          className={control()}
        />
        {/* A igual número las ordena el backend alfabéticamente, así que dejar
            todo en 0 no da un orden aleatorio. */}
        <p className="mt-1.5 text-xs text-neutral-400">
          Menor primero. A igual número, por orden alfabético.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
          <p className="text-[13px] text-red-600">{error}</p>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className={cn(cta({ variant: "outline", size: "sm" }))}>
          Cancelar
        </button>
        <button type="submit" disabled={guardando} className={cn(cta({ size: "sm" }))}>
          {guardando ? "Guardando…" : category ? "Guardar" : "Crear"}
        </button>
      </div>
    </form>
  )
}
