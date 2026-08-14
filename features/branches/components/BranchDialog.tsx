"use client"

import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { cta } from "@/components/CtaLink"
import { control, controlClasses } from "@/components/form"
import { WEEK_DAYS } from "@/lib/days"
import { cn } from "@/lib/utils"
import { apiErrorMessage } from "@/lib/errors"
import type { Branch, BusinessHour } from "@/types"
import { useBranch, useBusinessHours, useCreateBranch, useSaveBranch } from "../hooks/useBranches"
import { toDrafts, toPayload, validateHours, type DayDraft } from "../lib/businessHours"

interface Props {
  /** `null` con `open` en true = alta de una sucursal nueva. */
  branch: Branch | null
  open: boolean
  onClose: () => void
}

export function BranchDialog({ branch, open, onClose }: Props) {
  const editando = branch !== null
  const detail = useBranch(branch?.id ?? null)
  const hours = useBusinessHours(branch?.id ?? null)

  const cargando = editando && (detail.isPending || hours.isPending)
  const error = detail.error ?? hours.error

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex max-h-[88vh] flex-col sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar sucursal" : "Nueva sucursal"}</DialogTitle>
          <DialogDescription>
            {editando ? "Datos de contacto y horario de atención." : "Nace abierta de lunes a viernes; después la ajustás."}
          </DialogDescription>
        </DialogHeader>

        {cargando && (
          <div className="space-y-3 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        )}

        {!cargando && error && (
          <p className="py-8 text-center text-[13px] text-neutral-500">
            {apiErrorMessage(error, "No pudimos cargar la sucursal.")}
          </p>
        )}

        {!cargando && !error && (
          <BranchForm
            key={branch?.id ?? "nueva"}
            branch={branch}
            initialHours={hours.data ?? []}
            onDone={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function BranchForm({
  branch,
  initialHours,
  onDone,
}: {
  branch: Branch | null
  initialHours: BusinessHour[]
  onDone: () => void
}) {
  const [name, setName] = useState(branch?.name ?? "")
  const [address, setAddress] = useState(branch?.address ?? "")
  const [phone, setPhone] = useState(branch?.phone ?? "")
  const [isActive, setIsActive] = useState(branch?.isActive ?? true)
  const [days, setDays] = useState<DayDraft[]>(() => toDrafts(initialHours))

  const create = useCreateBranch()
  const save = useSaveBranch()
  const guardando = create.isPending || save.isPending

  const errors = useMemo(() => validateHours(days), [days])
  const problem = !name.trim() ? "El nombre es requerido" : errors.size > 0 ? "Revisá los horarios marcados" : null

  function patchDay(dayOfWeek: number, changes: Partial<DayDraft>) {
    setDays((previous) => previous.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...changes } : d)))
  }

  /**
   * Se usa `mutate` con `onSuccess` y no `await mutateAsync`: si el backend
   * rechaza —el plan tiene un tope de sucursales, por ejemplo— la promesa
   * rechazada escapa del handler y el navegador la reporta como error de página,
   * aunque el hook ya la haya mostrado en un toast.
   */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (problem) return

    if (branch) {
      save.mutate({
        id: branch.id,
        // Vacío se manda como `null` para borrar el dato, no como "".
        branch: { name: name.trim(), address: address.trim() || null, phone: phone.trim() || null, isActive },
        days: toPayload(days),
      }, { onSuccess: onDone })
    } else {
      // En el alta el backend arma la semana por defecto; los horarios se
      // ajustan al editar, cuando ya existe el id contra el que hacer el PUT.
      create.mutate({
        name: name.trim(),
        ...(address.trim() ? { address: address.trim() } : {}),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      }, { onSuccess: onDone })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="-mx-6 flex-1 space-y-4 overflow-y-auto px-6">
        <div>
          <label htmlFor="branchName" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
            Nombre
          </label>
          <input
            id="branchName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sucursal Centro"
            className={cn(controlClasses, "border-black/10")}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="branchAddress" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
              Dirección
            </label>
            <input
              id="branchAddress"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Av. Corrientes 1234"
              className={cn(controlClasses, "border-black/10")}
            />
          </div>
          <div>
            <label htmlFor="branchPhone" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
              Teléfono
            </label>
            <input
              id="branchPhone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="11-5555-5555"
              className={cn(controlClasses, "border-black/10")}
            />
          </div>
        </div>

        {branch && (
          <>
            <div className="flex items-start justify-between gap-4 rounded-xl border border-black/[0.07] bg-neutral-50 px-4 py-3">
              <div>
                <p className="text-[13px] font-medium text-neutral-900">Sucursal activa</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Desactivarla la saca de la agenda sin borrar su historial.
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} aria-label="Sucursal activa" />
            </div>

            <div>
              <p className="mb-2 text-[13px] font-semibold text-neutral-900">Horario de atención</p>
              <div className="divide-y divide-black/[0.06] rounded-xl border border-black/[0.07]">
                {days.map((day) => {
                  const label = WEEK_DAYS.find((d) => d.value === day.dayOfWeek)!.label
                  const dayError = errors.get(day.dayOfWeek)
                  return (
                    <div key={day.dayOfWeek} className="px-4 py-2.5">
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="flex w-32 shrink-0 cursor-pointer items-center gap-2 text-[13px] text-neutral-700">
                          <input
                            type="checkbox"
                            checked={!day.isClosed}
                            onChange={(e) => patchDay(day.dayOfWeek, { isClosed: !e.target.checked })}
                            className="size-3.5 accent-violet-600"
                          />
                          {label}
                        </label>

                        {day.isClosed ? (
                          <span className="text-[13px] text-neutral-400">Cerrado</span>
                        ) : (
                          <>
                            <input
                              type="time"
                              aria-label={`Apertura del ${label}`}
                              value={day.opensAt}
                              onChange={(e) => patchDay(day.dayOfWeek, { opensAt: e.target.value })}
                              className={cn(control(dayError), "w-auto py-1.5 text-[13px]")}
                            />
                            <span className="text-[13px] text-neutral-400">a</span>
                            <input
                              type="time"
                              aria-label={`Cierre del ${label}`}
                              value={day.closesAt}
                              onChange={(e) => patchDay(day.dayOfWeek, { closesAt: e.target.value })}
                              className={cn(control(dayError), "w-auto py-1.5 text-[13px]")}
                            />
                          </>
                        )}
                      </div>
                      {dayError && <p className="mt-1 text-xs text-red-500">{dayError}</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-black/[0.06] pt-4">
        {problem && <p className="mr-auto text-[13px] text-red-600">{problem}</p>}
        <button type="button" onClick={onDone} className={cn(cta({ variant: "outline", size: "sm" }))}>
          Cancelar
        </button>
        <button type="submit" disabled={guardando || Boolean(problem)} className={cn(cta({ size: "sm" }))}>
          {guardando ? "Guardando…" : branch ? "Guardar" : "Crear sucursal"}
        </button>
      </div>
    </form>
  )
}
