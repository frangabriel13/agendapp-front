"use client"

import { useMemo, useState } from "react"
import { Plus, Trash2, TriangleAlert } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cta } from "@/components/CtaLink"
import { control, controlClasses } from "@/components/form"
import { cn } from "@/lib/utils"
import { apiErrorMessage } from "@/lib/errors"
import { useBranches } from "@/features/branches/hooks/useBranches"
import type { Branch, Employee, EmployeeShift } from "@/types"
import { useEmployeeDetail, useEmployeeSchedules, useSaveSchedule } from "../hooks/useEmployees"
import { fullName } from "../lib/roles"
import {
  WEEK_DAYS,
  formatHours,
  newShift,
  shiftsOfDay,
  toDrafts,
  toPayload,
  validateShifts,
  weeklyMinutes,
  type DraftShift,
} from "../lib/schedule"

interface Props {
  employee: Employee | null
  onClose: () => void
}

export function ScheduleDialog({ employee, onClose }: Props) {
  const detail = useEmployeeDetail(employee?.id ?? null)
  const schedules = useEmployeeSchedules(employee?.id ?? null)
  const branches = useBranches()

  const cargando = detail.isPending || schedules.isPending || branches.isPending
  const error = detail.error ?? schedules.error ?? branches.error

  return (
    <Dialog open={employee !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[88vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sucursales y horarios</DialogTitle>
          <DialogDescription>
            {employee ? `Dónde y cuándo trabaja ${fullName(employee)}.` : "Cargando…"}
          </DialogDescription>
        </DialogHeader>

        {employee && cargando && <EditorSkeleton />}

        {employee && !cargando && error && (
          <p className="py-8 text-center text-[13px] text-neutral-500">
            {apiErrorMessage(error, "No pudimos cargar los horarios.")}
          </p>
        )}

        {/*
          El editor se monta recién cuando están los tres pedidos, y arranca su
          estado desde las props. Así no hace falta un efecto que copie datos a
          estado —que además dispara la regla `set-state-in-effect`—, y la `key`
          lo reinicia solo al abrirlo para otra persona.
        */}
        {employee && !cargando && !error && detail.data && schedules.data && branches.data && (
          <ScheduleEditor
            key={employee.id}
            employeeId={employee.id}
            branches={branches.data.filter((b) => b.isActive)}
            initialBranchIds={detail.data.branchIds}
            initialShifts={schedules.data}
            onSaved={onClose}
            onCancel={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

interface EditorProps {
  employeeId: string
  branches: Branch[]
  initialBranchIds: string[]
  initialShifts: EmployeeShift[]
  onSaved: () => void
  onCancel: () => void
}

function ScheduleEditor({
  employeeId,
  branches,
  initialBranchIds,
  initialShifts,
  onSaved,
  onCancel,
}: EditorProps) {
  const [branchIds, setBranchIds] = useState<string[]>(initialBranchIds)
  const [drafts, setDrafts] = useState<DraftShift[]>(() => toDrafts(initialShifts))
  const save = useSaveSchedule()

  const errors = useMemo(() => validateShifts(drafts, branchIds), [drafts, branchIds])
  const total = weeklyMinutes(drafts)

  function toggleBranch(id: string) {
    setBranchIds((previous) =>
      previous.includes(id) ? previous.filter((b) => b !== id) : [...previous, id],
    )
  }

  function patch(key: string, changes: Partial<DraftShift>) {
    setDrafts((previous) => previous.map((s) => (s.key === key ? { ...s, ...changes } : s)))
  }

  async function handleSave() {
    if (errors.size > 0) return
    await save.mutateAsync({ id: employeeId, branchIds, shifts: toPayload(drafts) })
    onSaved()
  }

  if (branches.length === 0) {
    return (
      <p className="py-8 text-center text-[13px] text-neutral-500">
        Todavía no hay sucursales activas. Creá una antes de asignar horarios.
      </p>
    )
  }

  return (
    <>
      <div className="-mx-6 flex-1 overflow-y-auto px-6">
        <section>
          <h3 className="text-[13px] font-semibold text-neutral-900">Sucursales</h3>
          <p className="mt-1 text-[13px] text-neutral-500">Dónde puede atender.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {branches.map((branch) => {
              const active = branchIds.includes(branch.id)
              return (
                <label
                  key={branch.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] transition-colors",
                    active
                      ? "border-violet-300 bg-violet-50 text-violet-800"
                      : "border-black/10 text-neutral-600 hover:bg-neutral-50",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleBranch(branch.id)}
                    className="size-3.5 accent-violet-600"
                  />
                  {branch.name}
                </label>
              )
            })}
          </div>
        </section>

        <section className="mt-7">
          <div className="flex items-baseline justify-between">
            <h3 className="text-[13px] font-semibold text-neutral-900">Horarios</h3>
            <p className="text-[13px] text-neutral-500">
              {total > 0 ? `${formatHours(total)} por semana` : "Sin horarios cargados"}
            </p>
          </div>

          {branchIds.length === 0 && (
            <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[13px] text-amber-800">
              <TriangleAlert size={15} className="mt-0.5 shrink-0 text-amber-600" />
              Elegí al menos una sucursal para poder cargar horarios.
            </p>
          )}

          <div className="mt-3 divide-y divide-black/[0.06] rounded-xl border border-black/[0.07]">
            {WEEK_DAYS.map((day) => (
              <DayRow
                key={day.value}
                label={day.label}
                shifts={shiftsOfDay(drafts, day.value)}
                branches={branches.filter((b) => branchIds.includes(b.id))}
                errors={errors}
                disabled={branchIds.length === 0}
                onAdd={() => setDrafts((p) => [...p, newShift(day.value, branchIds[0] ?? "")])}
                onRemove={(key) => setDrafts((p) => p.filter((s) => s.key !== key))}
                onPatch={patch}
              />
            ))}
          </div>
        </section>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-black/[0.06] pt-4">
        {errors.size > 0 && (
          <p className="mr-auto text-[13px] text-red-600">
            Revisá {errors.size === 1 ? "el tramo marcado" : `los ${errors.size} tramos marcados`}
          </p>
        )}
        <button type="button" onClick={onCancel} className={cn(cta({ variant: "outline", size: "sm" }))}>
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={errors.size > 0 || save.isPending}
          className={cn(cta({ size: "sm" }))}
        >
          {save.isPending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </>
  )
}

interface DayRowProps {
  label: string
  shifts: DraftShift[]
  branches: Branch[]
  errors: Map<string, string>
  disabled: boolean
  onAdd: () => void
  onRemove: (key: string) => void
  onPatch: (key: string, changes: Partial<DraftShift>) => void
}

function DayRow({ label, shifts, branches, errors, disabled, onAdd, onRemove, onPatch }: DayRowProps) {
  return (
    <div className="flex gap-4 px-4 py-3">
      <p className="w-24 shrink-0 pt-2 text-[13px] font-medium text-neutral-700">{label}</p>

      <div className="min-w-0 flex-1 space-y-2">
        {shifts.length === 0 && <p className="py-2 text-[13px] text-neutral-400">Libre</p>}

        {shifts.map((shift) => {
          const error = errors.get(shift.key)
          return (
            <div key={shift.key}>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label={`Sucursal del tramo de ${label}`}
                  value={shift.branchId}
                  onChange={(e) => onPatch(shift.key, { branchId: e.target.value })}
                  className={cn(control(error), "w-auto flex-1 py-1.5 text-[13px]")}
                >
                  <option value="">Elegí…</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  aria-label={`Hora de inicio del tramo de ${label}`}
                  value={shift.startsAt}
                  onChange={(e) => onPatch(shift.key, { startsAt: e.target.value })}
                  className={cn(controlClasses, "w-auto border-black/10 py-1.5 text-[13px]")}
                />
                <span className="text-[13px] text-neutral-400">a</span>
                <input
                  type="time"
                  aria-label={`Hora de fin del tramo de ${label}`}
                  value={shift.endsAt}
                  onChange={(e) => onPatch(shift.key, { endsAt: e.target.value })}
                  className={cn(controlClasses, "w-auto border-black/10 py-1.5 text-[13px]")}
                />
                <button
                  type="button"
                  onClick={() => onRemove(shift.key)}
                  aria-label={`Quitar el tramo de ${label} de ${shift.startsAt} a ${shift.endsAt}`}
                  className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>
          )
        })}

        {/* El nombre accesible lleva el día: siete botones "Agregar tramo"
            idénticos no se distinguen desde un lector de pantalla. */}
        <button
          type="button"
          onClick={onAdd}
          disabled={disabled}
          aria-label={`Agregar tramo el ${label}`}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] text-violet-600 transition-colors hover:bg-violet-50 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent"
        >
          <Plus size={14} />
          Agregar tramo
        </button>
      </div>
    </div>
  )
}

function EditorSkeleton() {
  return (
    <div className="space-y-3 py-4">
      <div className="h-9 w-48 animate-pulse rounded-full bg-neutral-100" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-neutral-100" />
      ))}
    </div>
  )
}
