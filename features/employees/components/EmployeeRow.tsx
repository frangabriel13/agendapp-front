"use client"

import { useState } from "react"
import { CalendarClock, CalendarOff, MoreHorizontal, Send, ShieldCheck, Trash2, UserCheck, UserX } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { AssignableRole, Employee, EmployeeInvitation } from "@/types"
import { useRemoveEmployee, useResendInvitation, useUpdateEmployee } from "../hooks/useEmployees"
import { ALL_ROLE_LABELS, ROLE_LABELS, STATUS_BADGE, STATUS_LABELS, fullName, initials } from "../lib/roles"

interface Props {
  employee: Employee
  /** `false` para un PROFESSIONAL: ve la lista pero no puede tocar nada. */
  canManage: boolean
  /** Id de empleado de quien está mirando, para no dejarlo actuar sobre sí mismo. */
  currentEmployeeId: string | undefined
  onInvitation: (invitation: EmployeeInvitation) => void
  onEditSchedule: (employee: Employee) => void
  onEditTimeOff: (employee: Employee) => void
}

export function EmployeeRow({
  employee,
  canManage,
  currentEmployeeId,
  onInvitation,
  onEditSchedule,
  onEditTimeOff,
}: Props) {
  const [confirmingRemoval, setConfirmingRemoval] = useState(false)
  const update = useUpdateEmployee()
  const remove = useRemoveEmployee()
  const resend = useResendInvitation()

  const isSelf = employee.id === currentEmployeeId
  /**
   * Al dueño no se le cambia el rol ni se lo da de baja —el backend lo rechaza—
   * y a uno mismo tampoco: desactivarse es quedarse afuera sin poder volver.
   *
   * Los horarios son otra cosa: el dueño también atiende, y editarse los propios
   * es normal. Por eso esa opción no pasa por acá.
   */
  const editable = canManage && !employee.isOwner && !isSelf
  const busy = update.isPending || remove.isPending || resend.isPending

  const badges = (
    <>
      <span className="rounded-full border border-black/[0.07] bg-neutral-50 px-2.5 py-1 text-[11px] font-medium text-neutral-600">
        {ALL_ROLE_LABELS[employee.role]}
      </span>
      <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-medium", STATUS_BADGE[employee.status])}>
        {STATUS_LABELS[employee.status]}
      </span>
      {!employee.isActive && (
        <span className="rounded-full border border-black/[0.07] bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-500">
          Inactivo
        </span>
      )}
    </>
  )

  return (
    <li className="flex items-center gap-4 px-5 py-4">
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[13px] font-semibold text-violet-700"
      >
        {initials(employee)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-900">
          {fullName(employee)}
          {isSelf && <span className="ml-2 text-[11px] font-normal text-neutral-400">(vos)</span>}
        </p>
        <p className="truncate text-[13px] text-neutral-500">{employee.user.email}</p>
        {/* En pantallas chicas no hay lugar a la derecha, pero el rol y el estado
            son justo lo que se viene a mirar: bajan a una segunda línea. */}
        <div className="mt-2 flex flex-wrap gap-1.5 sm:hidden">{badges}</div>
      </div>

      <div className="hidden items-center gap-2 sm:flex">{badges}</div>

      {canManage ? (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={busy}
              aria-label={`Acciones para ${fullName(employee)}`}
              className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50"
            >
              <MoreHorizontal size={18} />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onSelect={() => onEditSchedule(employee)}>
                <CalendarClock size={14} /> Sucursales y horarios
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onEditTimeOff(employee)}>
                <CalendarOff size={14} /> Ausencias
              </DropdownMenuItem>

              {editable && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <ShieldCheck size={14} /> Rol
                  </DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={employee.role}
                    onValueChange={(role) => update.mutate({ id: employee.id, role: role as AssignableRole })}
                  >
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <DropdownMenuRadioItem key={value} value={value}>
                        {label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>

                  <DropdownMenuSeparator />

                  {employee.status === "PENDING" && (
                    <DropdownMenuItem
                      onSelect={() => resend.mutateAsync(employee.id).then(onInvitation).catch(() => {})}
                    >
                      <Send size={14} /> Reenviar invitación
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem onSelect={() => update.mutate({ id: employee.id, isActive: !employee.isActive })}>
                    {employee.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                    {employee.isActive ? "Desactivar" : "Reactivar"}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem variant="destructive" onSelect={() => setConfirmingRemoval(true)}>
                    <Trash2 size={14} /> Eliminar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialog open={confirmingRemoval} onOpenChange={setConfirmingRemoval}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar a {fullName(employee)}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Pierde el acceso al sistema. Si ya atendió turnos, queda desactivado en vez de borrarse, para no
                  romper el historial.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => remove.mutate(employee.id)}>Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : (
        // Ocupa el mismo lugar que el botón para que las filas no se desalineen.
        <span aria-hidden className="size-[34px] shrink-0" />
      )}
    </li>
  )
}
