"use client"

import { useState } from "react"
import { Building2, CalendarX2, MoreHorizontal, Pencil, Plus, RotateCw, Trash2 } from "lucide-react"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cta } from "@/components/CtaLink"
import { Page, PageHeader } from "../ui/Page"
import { cn } from "@/lib/utils"
import { apiErrorMessage } from "@/lib/errors"
import { canManage, useSession } from "@/features/auth/hooks/useAuth"
import { BranchDialog } from "@/features/branches/components/BranchDialog"
import { SpecialDaysDialog } from "@/features/branches/components/SpecialDaysDialog"
import { useBranches, useRemoveBranch, useToggleBranch } from "@/features/branches/hooks/useBranches"
import type { Branch } from "@/types"

export default function SucursalesPage() {
  const { data: session } = useSession()
  const branches = useBranches()
  const [editing, setEditing] = useState<Branch | null>(null)
  const [creating, setCreating] = useState(false)
  const [specialDays, setSpecialDays] = useState<Branch | null>(null)
  const [removing, setRemoving] = useState<Branch | null>(null)

  const manage = canManage(session?.employee.role)
  const remove = useRemoveBranch()

  return (
    <Page>
      <PageHeader
        title="Sucursales"
        description="Dónde atendés y con qué horario."
        action={
          manage && (
            <button type="button" onClick={() => setCreating(true)} className={cn(cta({ size: "sm" }))}>
              <Plus size={15} />
              Nueva sucursal
            </button>
          )
        }
      />

      <div className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
        {branches.isPending && (
          <ul className="divide-y divide-black/[0.06]">
            {Array.from({ length: 2 }).map((_, i) => (
              <li key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="size-9 shrink-0 animate-pulse rounded-xl bg-neutral-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-40 animate-pulse rounded bg-neutral-100" />
                  <div className="h-3 w-56 animate-pulse rounded bg-neutral-100" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {branches.isError && (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium text-neutral-900">No pudimos cargar las sucursales</p>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-neutral-500">
              {apiErrorMessage(branches.error, "Revisá tu conexión y probá de nuevo.")}
            </p>
            <button
              type="button"
              onClick={() => branches.refetch()}
              className={cn(cta({ variant: "outline", size: "sm" }), "mt-5")}
            >
              <RotateCw size={15} />
              Reintentar
            </button>
          </div>
        )}

        {branches.data?.length === 0 && (
          <div className="px-5 py-12 text-center">
            <Building2 size={28} aria-hidden className="mx-auto mb-3 text-neutral-300" />
            <p className="text-sm font-medium text-neutral-900">Todavía no hay sucursales</p>
            <p className="mt-1 text-[13px] text-neutral-500">
              {manage ? "Creá la primera para empezar a cargar horarios." : "Pedile a un administrador que cree una."}
            </p>
          </div>
        )}

        {branches.data && branches.data.length > 0 && (
          <ul className="divide-y divide-black/[0.06]">
            {branches.data.map((branch) => (
              <BranchRow
                key={branch.id}
                branch={branch}
                canManage={manage}
                onEdit={setEditing}
                onSpecialDays={setSpecialDays}
                onRemove={setRemoving}
              />
            ))}
          </ul>
        )}
      </div>

      {manage && (
        <BranchDialog
          branch={editing}
          open={creating || editing !== null}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
        />
      )}
      <SpecialDaysDialog branch={specialDays} onClose={() => setSpecialDays(null)} />

      <AlertDialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Si ya tuvo turnos, queda desactivada en vez de borrarse, para no romper el historial. Los empleados
              asignados dejan de tenerla.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => removing && remove.mutate(removing.id)}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  )
}

interface RowProps {
  branch: Branch
  canManage: boolean
  onEdit: (branch: Branch) => void
  onSpecialDays: (branch: Branch) => void
  onRemove: (branch: Branch) => void
}

function BranchRow({ branch, canManage, onEdit, onSpecialDays, onRemove }: RowProps) {
  const toggle = useToggleBranch()

  return (
    <li className="flex items-center gap-4 px-5 py-4">
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700"
      >
        <Building2 size={16} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-900">{branch.name}</p>
        <p className="truncate text-[13px] text-neutral-500">
          {[branch.address, branch.phone].filter(Boolean).join(" · ") || "Sin datos de contacto"}
        </p>
      </div>

      {!branch.isActive && (
        <span className="shrink-0 rounded-full border border-black/[0.07] bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-500">
          Inactiva
        </span>
      )}

      {canManage ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={toggle.isPending}
            aria-label={`Acciones para ${branch.name}`}
            className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50"
          >
            <MoreHorizontal size={18} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onSelect={() => onEdit(branch)}>
              <Pencil size={14} /> Editar y horarios
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onSpecialDays(branch)}>
              <CalendarX2 size={14} /> Feriados y días especiales
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => toggle.mutate({ id: branch.id, isActive: !branch.isActive })}>
              {branch.isActive ? "Desactivar" : "Reactivar"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => onRemove(branch)}>
              <Trash2 size={14} /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <span aria-hidden className="size-[34px] shrink-0" />
      )}
    </li>
  )
}
