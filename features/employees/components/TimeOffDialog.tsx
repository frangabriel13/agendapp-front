"use client"

import { useMemo, useState } from "react"
import { CalendarOff, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { cta } from "@/components/CtaLink"
import { control, controlClasses, selectClasses } from "@/components/form"
import { cn } from "@/lib/utils"
import { apiErrorMessage } from "@/lib/errors"
import { useBranches } from "@/features/branches/hooks/useBranches"
import type { Branch, Employee, TimeOff } from "@/types"
import {
  useCreateTimeOff,
  useEmployeeDetail,
  useRemoveTimeOff,
  useTimeOff,
} from "../hooks/useEmployees"
import { fullName } from "../lib/roles"
import { draftToPayload, formatRange, isPast, sortTimeOff, validateDraft, type TimeOffDraft } from "../lib/timeOff"
import { today } from "@/lib/time"

interface Props {
  employee: Employee | null
  onClose: () => void
}

export function TimeOffDialog({ employee, onClose }: Props) {
  const timeOff = useTimeOff(employee?.id ?? null)
  const detail = useEmployeeDetail(employee?.id ?? null)
  const branches = useBranches()

  const cargando = timeOff.isPending || detail.isPending || branches.isPending
  const error = timeOff.error ?? detail.error ?? branches.error

  const asignadas = useMemo(() => {
    if (!detail.data || !branches.data) return []
    return branches.data.filter((b) => detail.data.branchIds.includes(b.id))
  }, [detail.data, branches.data])

  return (
    <Dialog open={employee !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[88vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ausencias</DialogTitle>
          <DialogDescription>
            {employee ? `Cuándo no va a estar ${fullName(employee)}.` : "Cargando…"}
          </DialogDescription>
        </DialogHeader>

        {employee && cargando && (
          <div className="space-y-3 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        )}

        {employee && !cargando && error && (
          <p className="py-8 text-center text-[13px] text-neutral-500">
            {apiErrorMessage(error, "No pudimos cargar las ausencias.")}
          </p>
        )}

        {employee && !cargando && !error && timeOff.data && (
          <>
            <NewTimeOffForm key={employee.id} employeeId={employee.id} branches={asignadas} />
            <TimeOffList employeeId={employee.id} items={timeOff.data} branches={branches.data ?? []} />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function NewTimeOffForm({ employeeId, branches }: { employeeId: string; branches: Branch[] }) {
  const [draft, setDraft] = useState<TimeOffDraft>(() => ({
    allDay: true,
    startDate: today(),
    startTime: "09:00",
    endDate: today(),
    endTime: "18:00",
    branchId: "",
    reason: "",
  }))
  const [touched, setTouched] = useState(false)
  const create = useCreateTimeOff()

  const problema = validateDraft(draft)
  const patch = (changes: Partial<TimeOffDraft>) => setDraft((p) => ({ ...p, ...changes }))

  function handleAdd() {
    setTouched(true)
    if (problema) return
    create.mutate(
      { id: employeeId, ...draftToPayload(draft) },
      {
        onSuccess: () => {
          setDraft((p) => ({ ...p, reason: "" }))
          setTouched(false)
        },
      },
    )
  }

  return (
    <div className="rounded-xl border border-black/[0.07] bg-neutral-50 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-neutral-900">Nueva ausencia</p>
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-neutral-600">
          <Switch checked={draft.allDay} onCheckedChange={(allDay) => patch({ allDay })} />
          Todo el día
        </label>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Campo label="Desde" htmlFor="desde">
          <input
            id="desde"
            type="date"
            value={draft.startDate}
            onChange={(e) => patch({ startDate: e.target.value })}
            className={cn(controlClasses, "border-black/10 py-2 text-[13px]")}
          />
          {!draft.allDay && (
            <input
              type="time"
              aria-label="Hora de inicio"
              value={draft.startTime}
              onChange={(e) => patch({ startTime: e.target.value })}
              className={cn(controlClasses, "mt-2 border-black/10 py-2 text-[13px]")}
            />
          )}
        </Campo>

        <Campo label="Hasta" htmlFor="hasta">
          <input
            id="hasta"
            type="date"
            value={draft.endDate}
            onChange={(e) => patch({ endDate: e.target.value })}
            className={cn(control(touched && problema), "py-2 text-[13px]")}
          />
          {!draft.allDay && (
            <input
              type="time"
              aria-label="Hora de fin"
              value={draft.endTime}
              onChange={(e) => patch({ endTime: e.target.value })}
              className={cn(controlClasses, "mt-2 border-black/10 py-2 text-[13px]")}
            />
          )}
        </Campo>
      </div>

      {/* Con una sola sucursal la distinción no aporta: no estar ahí es no estar. */}
      {branches.length > 1 && (
        <div className="mt-3">
          <Campo label="Alcance" htmlFor="alcance">
            <select
              id="alcance"
              value={draft.branchId}
              onChange={(e) => patch({ branchId: e.target.value })}
              className={cn(selectClasses, "border-black/10 py-2 text-[13px]")}
            >
              <option value="">En todas las sucursales</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  Solo en {b.name}
                </option>
              ))}
            </select>
          </Campo>
        </div>
      )}

      <div className="mt-3">
        <Campo label="Motivo (opcional)" htmlFor="motivo">
          <input
            id="motivo"
            type="text"
            placeholder="Vacaciones, licencia, turno médico…"
            value={draft.reason}
            onChange={(e) => patch({ reason: e.target.value })}
            className={cn(controlClasses, "border-black/10 py-2 text-[13px]")}
          />
        </Campo>
      </div>

      <div className="mt-4 flex items-center justify-end gap-3">
        {touched && problema && <p className="mr-auto text-xs text-red-500">{problema}</p>}
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

function Campo({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-neutral-600">
        {label}
      </label>
      {children}
    </div>
  )
}

function TimeOffList({
  employeeId,
  items,
  branches,
}: {
  employeeId: string
  items: TimeOff[]
  branches: Branch[]
}) {
  const remove = useRemoveTimeOff()
  const ordenadas = useMemo(() => sortTimeOff(items), [items])
  const nombreDe = (id: string | null) => branches.find((b) => b.id === id)?.name

  if (items.length === 0) {
    return (
      <div className="py-10 text-center">
        <CalendarOff size={26} aria-hidden className="mx-auto mb-3 text-neutral-300" />
        <p className="text-[13px] text-neutral-500">No hay ausencias cargadas.</p>
      </div>
    )
  }

  return (
    <ul className="-mx-6 flex-1 divide-y divide-black/[0.06] overflow-y-auto px-6">
      {ordenadas.map((item) => {
        const pasada = isPast(item)
        const sucursal = nombreDe(item.branchId)
        return (
          <li key={item.id} className={cn("flex items-center gap-3 py-3", pasada && "opacity-55")}>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-neutral-900">{formatRange(item.startsAt, item.endsAt)}</p>
              <p className="truncate text-xs text-neutral-500">
                {item.reason ?? "Sin motivo"}
                {sucursal && ` · solo en ${sucursal}`}
                {pasada && " · finalizada"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => remove.mutate({ id: employeeId, timeOffId: item.id })}
              disabled={remove.isPending}
              aria-label={`Eliminar la ausencia del ${formatRange(item.startsAt, item.endsAt)}`}
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
