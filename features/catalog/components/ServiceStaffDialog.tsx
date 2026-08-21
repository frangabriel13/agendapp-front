"use client"

import { useState } from "react"
import { Check, TriangleAlert } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cta } from "@/components/CtaLink"
import { cn } from "@/lib/utils"
import { apiErrorMessage } from "@/lib/errors"
import { useBranches } from "@/features/branches/hooks/useBranches"
import { useEmployees } from "@/features/employees/hooks/useEmployees"
import type { Service } from "@/types"
import {
  useAssignableEmployees,
  useResources,
  useSaveServiceStaff,
  useServiceEmployees,
  useServiceResources,
} from "../hooks/useCatalog"
import {
  buildMatrix,
  hasChanges,
  selectionFrom,
  toAssignments,
  toggleRow,
  togglePair,
} from "../lib/assignments"

interface Props {
  service: Service | null
  onClose: () => void
}

export function ServiceStaffDialog({ service, onClose }: Props) {
  const open = service !== null

  const branches = useBranches()
  const employees = useEmployees()
  const asignables = useAssignableEmployees(employees.data, open)
  const guardadas = useServiceEmployees(service?.id ?? null)
  const recursos = useResources()
  const requeridos = useServiceResources(service?.id ?? null)

  const cargando =
    branches.isPending ||
    employees.isPending ||
    asignables.isPending ||
    guardadas.isPending ||
    requeridos.isPending

  const error = branches.error ?? employees.error ?? guardadas.error ?? requeridos.error

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex max-h-[88vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quién lo presta</DialogTitle>
          <DialogDescription>
            {service?.name} — marcá la persona <strong>y la sucursal</strong>. No es lo mismo hacerlo
            en Centro que en las dos.
          </DialogDescription>
        </DialogHeader>

        {cargando && (
          <div className="space-y-3 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        )}

        {!cargando && error && (
          <p className="py-8 text-center text-[13px] text-neutral-500">
            {apiErrorMessage(error, "No pudimos cargar el equipo.")}
          </p>
        )}

        {!cargando && !error && service && (
          <StaffForm
            key={service.id}
            service={service}
            branches={branches.data ?? []}
            employees={asignables.data}
            savedPairs={selectionFrom(guardadas.data ?? [])}
            resources={recursos.data ?? []}
            savedResources={(requeridos.data ?? []).map((r) => r.resourceId)}
            onDone={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function StaffForm({
  service,
  branches,
  employees,
  savedPairs,
  resources,
  savedResources,
  onDone,
}: {
  service: Service
  branches: ReturnType<typeof useBranches>["data"] & object
  employees: ReturnType<typeof useAssignableEmployees>["data"]
  savedPairs: Set<string>
  resources: ReturnType<typeof useResources>["data"] & object
  savedResources: string[]
  onDone: () => void
}) {
  /**
   * El estado nace de lo guardado y ya: el padre solo monta esta forma cuando
   * **todo** terminó de cargar —incluidos los detalles de cada empleado, que
   * llegan de a uno—, así que acá no hay nada que resincronizar después. El
   * `key={service.id}` del padre se encarga de reiniciarla al cambiar de
   * servicio.
   */
  const [selected, setSelected] = useState(savedPairs)
  const [pedidos, setPedidos] = useState(() => new Set(savedResources))

  const guardar = useSaveServiceStaff()
  const filas = buildMatrix(employees, branches, selected)
  const cambio =
    hasChanges(selected, savedPairs) ||
    pedidos.size !== savedResources.length ||
    savedResources.some((id) => !pedidos.has(id))

  const marcar = (employeeId: string, branchId: string) => {
    setSelected((prev) => togglePair(prev, employeeId, branchId))
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    guardar.mutate(
      {
        id: service.id,
        assignments: toAssignments(selected, employees),
        resourceIds: [...pedidos],
      },
      { onSuccess: onDone },
    )
  }

  const sinEquipo = employees.length === 0

  return (
    <form onSubmit={submit} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-0.5">
      {sinEquipo ? (
        <p className="py-8 text-center text-[13px] text-neutral-500">
          Todavía no hay nadie activo en el equipo.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-black/[0.07]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/[0.06] bg-neutral-50/60">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-neutral-500">
                  Profesional
                </th>
                {branches.map((branch) => (
                  <th
                    key={branch.id}
                    className="px-3 py-2.5 text-center text-xs font-medium text-neutral-500"
                  >
                    {branch.name.replace(/^Sucursal /, "")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05]">
              {filas.map((fila) => (
                <tr key={fila.employeeId} className={cn(fila.sinSucursales && "bg-neutral-50/50")}>
                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      disabled={fila.sinSucursales}
                      onClick={() =>
                        setSelected((prev) =>
                          toggleRow(prev, employees.find((e) => e.id === fila.employeeId)!, branches),
                        )
                      }
                      className="text-left text-[13px] font-medium text-neutral-900 disabled:text-neutral-400"
                    >
                      {fila.name}
                    </button>
                    {fila.sinSucursales && (
                      // Sin sucursal asignada no hay par posible. Decirlo evita
                      // que parezca que la fila está rota.
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-amber-600">
                        <TriangleAlert size={11} aria-hidden />
                        No tiene sucursal asignada
                      </p>
                    )}
                  </td>

                  {fila.cells.map((cell) => (
                    <td key={cell.branchId} className="px-3 py-2.5 text-center">
                      <button
                        type="button"
                        disabled={!cell.enabled}
                        onClick={() => marcar(fila.employeeId, cell.branchId)}
                        aria-pressed={cell.checked}
                        aria-label={`${fila.name} en ${cell.branchName}`}
                        title={cell.enabled ? undefined : `${fila.name} no trabaja en ${cell.branchName}`}
                        className={cn(
                          "inline-flex size-6 items-center justify-center rounded-md border transition-colors",
                          !cell.enabled && "cursor-not-allowed border-black/[0.06] bg-neutral-50",
                          cell.enabled &&
                            (cell.checked
                              ? "border-violet-600 bg-violet-600 text-white"
                              : "border-black/15 bg-white hover:border-violet-400"),
                        )}
                      >
                        {cell.checked && <Check size={14} strokeWidth={3} aria-hidden />}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {resources.length > 0 && (
        <div>
          <span className="mb-2 block text-[13px] font-medium text-neutral-700">
            Recursos que ocupa
          </span>
          <div className="flex flex-wrap gap-2">
            {resources.map((resource) => {
              const activo = pedidos.has(resource.id)
              return (
                <button
                  key={resource.id}
                  type="button"
                  onClick={() =>
                    setPedidos((prev) => {
                      const next = new Set(prev)
                      if (next.has(resource.id)) next.delete(resource.id)
                      else next.add(resource.id)
                      return next
                    })
                  }
                  aria-pressed={activo}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                    activo
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-black/10 bg-white text-neutral-600 hover:border-neutral-400",
                  )}
                >
                  {resource.name}
                  <span className={cn("ml-1.5 text-[11px]", activo ? "text-white/60" : "text-neutral-400")}>
                    {resource.branch?.name?.replace(/^Sucursal /, "")}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-neutral-400">
            Un turno de este servicio va a reservar también el recurso, así que dos no pueden
            superponerse.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-1">
        <p className="text-xs text-neutral-400">
          {selected.size === 0
            ? "Sin nadie asignado, este servicio no se puede reservar."
            : `${selected.size} ${selected.size === 1 ? "asignación" : "asignaciones"}`}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={onDone} className={cn(cta({ variant: "outline", size: "sm" }))}>
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardar.isPending || !cambio}
            className={cn(cta({ size: "sm" }))}
          >
            {guardar.isPending ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </form>
  )
}
