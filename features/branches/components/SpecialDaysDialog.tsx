"use client"

import { useMemo, useState } from "react"
import { CalendarX2, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { cta } from "@/components/CtaLink"
import { controlClasses } from "@/components/form"
import { cn } from "@/lib/utils"
import { apiErrorMessage } from "@/lib/errors"
import type { Branch, SpecialDay } from "@/types"
import { useCreateSpecialDay, useRemoveSpecialDay, useSpecialDays } from "../hooks/useBranches"
import {
  draftToPayload,
  formatCalendarDay,
  isPastDay,
  sortSpecialDays,
  validateSpecialDay,
  type SpecialDayDraft,
} from "../lib/specialDays"

export function SpecialDaysDialog({ branch, onClose }: { branch: Branch | null; onClose: () => void }) {
  const days = useSpecialDays(branch?.id ?? null)

  return (
    <Dialog open={branch !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[88vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Feriados y días especiales</DialogTitle>
          <DialogDescription>
            {branch ? `Excepciones al horario habitual de ${branch.name}.` : "Cargando…"}
          </DialogDescription>
        </DialogHeader>

        {branch && days.isPending && (
          <div className="space-y-3 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        )}

        {branch && days.error && (
          <p className="py-8 text-center text-[13px] text-neutral-500">
            {apiErrorMessage(days.error, "No pudimos cargar los días especiales.")}
          </p>
        )}

        {branch && days.data && (
          <>
            <NewSpecialDayForm key={branch.id} branchId={branch.id} />
            <SpecialDayList branchId={branch.id} days={days.data} />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function NewSpecialDayForm({ branchId }: { branchId: string }) {
  const [draft, setDraft] = useState<SpecialDayDraft>({
    date: "",
    isClosed: true,
    opensAt: "10:00",
    closesAt: "14:00",
    description: "",
  })
  const [touched, setTouched] = useState(false)
  const create = useCreateSpecialDay()

  const problem = validateSpecialDay(draft)
  const patch = (changes: Partial<SpecialDayDraft>) => setDraft((p) => ({ ...p, ...changes }))

  function handleAdd() {
    setTouched(true)
    if (problem) return
    create.mutate(
      { id: branchId, ...draftToPayload(draft) },
      {
        onSuccess: () => {
          setDraft((p) => ({ ...p, date: "", description: "" }))
          setTouched(false)
        },
      },
    )
  }

  return (
    <div className="rounded-xl border border-black/[0.07] bg-neutral-50 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-neutral-900">Agregar</p>
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-neutral-600">
          <Switch checked={draft.isClosed} onCheckedChange={(isClosed) => patch({ isClosed })} />
          Cerrado todo el día
        </label>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="specialDate" className="mb-1.5 block text-xs font-medium text-neutral-600">
            Fecha
          </label>
          <input
            id="specialDate"
            type="date"
            value={draft.date}
            onChange={(e) => patch({ date: e.target.value })}
            className={cn(controlClasses, "border-black/10 py-2 text-[13px]")}
          />
        </div>
        <div>
          <label htmlFor="specialDescription" className="mb-1.5 block text-xs font-medium text-neutral-600">
            Motivo (opcional)
          </label>
          <input
            id="specialDescription"
            value={draft.description}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder="Navidad, inventario…"
            className={cn(controlClasses, "border-black/10 py-2 text-[13px]")}
          />
        </div>
      </div>

      {!draft.isClosed && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="time"
            aria-label="Apertura del día especial"
            value={draft.opensAt}
            onChange={(e) => patch({ opensAt: e.target.value })}
            className={cn(controlClasses, "w-auto border-black/10 py-2 text-[13px]")}
          />
          <span className="text-[13px] text-neutral-400">a</span>
          <input
            type="time"
            aria-label="Cierre del día especial"
            value={draft.closesAt}
            onChange={(e) => patch({ closesAt: e.target.value })}
            className={cn(controlClasses, "w-auto border-black/10 py-2 text-[13px]")}
          />
        </div>
      )}

      <div className="mt-4 flex items-center justify-end gap-3">
        {touched && problem && <p className="mr-auto text-xs text-red-500">{problem}</p>}
        <button
          type="button"
          onClick={handleAdd}
          disabled={create.isPending}
          className={cn(cta({ size: "sm" }))}
        >
          {create.isPending ? "Agregando…" : "Agregar"}
        </button>
      </div>
    </div>
  )
}

function SpecialDayList({ branchId, days }: { branchId: string; days: SpecialDay[] }) {
  const remove = useRemoveSpecialDay()
  const ordenados = useMemo(() => sortSpecialDays(days), [days])

  if (days.length === 0) {
    return (
      <div className="py-10 text-center">
        <CalendarX2 size={26} aria-hidden className="mx-auto mb-3 text-neutral-300" />
        <p className="text-[13px] text-neutral-500">No hay feriados ni horarios especiales cargados.</p>
      </div>
    )
  }

  return (
    <ul className="-mx-6 flex-1 divide-y divide-black/[0.06] overflow-y-auto px-6">
      {ordenados.map((day) => {
        const pasado = isPastDay(day.date)
        return (
          <li key={day.id} className={cn("flex items-center gap-3 py-3", pasado && "opacity-55")}>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-neutral-900">
                {formatCalendarDay(day.date)}
                <span className="ml-2 font-normal text-neutral-500">
                  {day.isClosed ? "· cerrado" : `· ${day.opensAt} a ${day.closesAt}`}
                </span>
              </p>
              <p className="truncate text-xs text-neutral-500">
                {day.description ?? "Sin motivo"}
                {pasado && " · ya pasó"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => remove.mutate({ id: branchId, specialDayId: day.id })}
              disabled={remove.isPending}
              aria-label={`Eliminar el día especial del ${formatCalendarDay(day.date)}`}
              className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            >
              <Trash2 size={15} />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
