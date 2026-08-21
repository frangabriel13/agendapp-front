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
import { control, selectControl } from "@/components/form"
import { cn } from "@/lib/utils"
import { apiErrorMessage } from "@/lib/errors"
import { useBranches } from "@/features/branches/hooks/useBranches"
import type { Resource } from "@/types"
import { useCreateResource, useUpdateResource } from "../hooks/useCatalog"

interface Props {
  resource: Resource | null
  open: boolean
  onClose: () => void
}

export function ResourceDialog({ resource, open, onClose }: Props) {
  const editando = resource !== null
  const branches = useBranches()

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar recurso" : "Nuevo recurso"}</DialogTitle>
          <DialogDescription>
            Una camilla, una sala, un sillón: algo que un turno ocupa además del profesional.
          </DialogDescription>
        </DialogHeader>

        <ResourceForm
          key={resource?.id ?? "nuevo"}
          resource={resource}
          branches={branches.data ?? []}
          onDone={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}

function ResourceForm({
  resource,
  branches,
  onDone,
}: {
  resource: Resource | null
  branches: NonNullable<ReturnType<typeof useBranches>["data"]>
  onDone: () => void
}) {
  const [name, setName] = useState(resource?.name ?? "")
  const [description, setDescription] = useState(resource?.description ?? "")
  const [branchId, setBranchId] = useState(resource?.branch?.id ?? branches[0]?.id ?? "")
  const [error, setError] = useState<string | null>(null)

  const crear = useCreateResource()
  const actualizar = useUpdateResource()
  const guardando = crear.isPending || actualizar.isPending

  // El 403 del plan y el 409 del nombre repetido vienen redactados por el
  // backend: se muestran tal cual, que dicen más que cualquier texto de acá.
  const fallo = crear.error ?? actualizar.error

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return setError("Poné un nombre")
    if (!branchId) return setError("Elegí una sucursal")
    setError(null)

    if (resource) {
      actualizar.mutate(
        { id: resource.id, name: name.trim(), description: description.trim() || null },
        { onSuccess: onDone },
      )
      return
    }

    crear.mutate(
      {
        name: name.trim(),
        branchId,
        ...(description.trim() ? { description: description.trim() } : {}),
      },
      { onSuccess: onDone },
    )
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <label htmlFor="r-name" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
          Nombre
        </label>
        <input
          id="r-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          autoFocus
          placeholder="Camilla 1"
          className={control()}
        />
      </div>

      <div>
        <label htmlFor="r-branch" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
          Sucursal
        </label>
        <select
          id="r-branch"
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          // La sucursal no se puede mover: el nombre es único por sucursal y
          // cambiarla podría chocar con uno que ya existe del otro lado.
          disabled={resource !== null}
          className={selectControl()}
        >
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-neutral-400">
          {resource
            ? "La sucursal no se cambia: creá otro recurso si hace falta."
            : "El nombre puede repetirse entre sucursales, pero no dentro de una."}
        </p>
      </div>

      <div>
        <label htmlFor="r-desc" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
          Descripción <span className="font-normal text-neutral-400">(opcional)</span>
        </label>
        <textarea
          id="r-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={2}
          className={cn(control(), "resize-none")}
        />
      </div>

      {(error || fallo) && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
          <p className="text-[13px] text-red-600">
            {error ?? apiErrorMessage(fallo, "No pudimos guardar el recurso.")}
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className={cn(cta({ variant: "outline", size: "sm" }))}>
          Cancelar
        </button>
        <button type="submit" disabled={guardando} className={cn(cta({ size: "sm" }))}>
          {guardando ? "Guardando…" : resource ? "Guardar" : "Crear"}
        </button>
      </div>
    </form>
  )
}
