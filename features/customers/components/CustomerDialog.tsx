"use client"

import { useState } from "react"
import { UserRoundSearch } from "lucide-react"
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
import { apiErrorMessage, errorDetail } from "@/lib/errors"
import type { Customer, DuplicateCustomer } from "@/types"
import { useCreateCustomer, useUpdateCustomer } from "../hooks/useCustomers"
import { fullName } from "../lib/customer"

interface Props {
  customer: Customer | null
  open: boolean
  onClose: () => void
  /** Abrir la ficha que ya existía, cuando el teléfono estaba repetido. */
  onOpenExisting: (id: string) => void
}

export function CustomerDialog({ customer, open, onClose, onOpenExisting }: Props) {
  const editando = customer !== null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex max-h-[88vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
          <DialogDescription>
            Con el nombre y el teléfono alcanza; el resto se puede completar después.
          </DialogDescription>
        </DialogHeader>

        <CustomerForm
          key={customer?.id ?? "nuevo"}
          customer={customer}
          onDone={onClose}
          onOpenExisting={onOpenExisting}
        />
      </DialogContent>
    </Dialog>
  )
}

function CustomerForm({
  customer,
  onDone,
  onOpenExisting,
}: {
  customer: Customer | null
  onDone: () => void
  onOpenExisting: (id: string) => void
}) {
  const [firstName, setFirstName] = useState(customer?.firstName ?? "")
  const [lastName, setLastName] = useState(customer?.lastName ?? "")
  const [phone, setPhone] = useState(customer?.phone ?? "")
  const [email, setEmail] = useState(customer?.email ?? "")
  const [dateOfBirth, setDateOfBirth] = useState(customer?.dateOfBirth ?? "")
  const [notes, setNotes] = useState(customer?.notes ?? "")
  const [error, setError] = useState<string | null>(null)

  const crear = useCreateCustomer()
  const actualizar = useUpdateCustomer()
  const guardando = crear.isPending || actualizar.isPending
  const fallo = crear.error ?? actualizar.error

  /**
   * El 409 de teléfono repetido **no es un error: es un duplicado con la ficha
   * adentro**. El backend manda `existingCustomer` justamente para poder
   * preguntar "¿es esta persona?" sin ir a buscarla con otra request.
   *
   * No hay merge automático a propósito: dos personas pueden compartir teléfono
   * —una madre y su hija—, y unir historiales es decisión de quien atiende.
   */
  const duplicado = errorDetail<DuplicateCustomer>(fallo, 409, "existingCustomer")

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!firstName.trim()) return setError("Poné al menos el nombre")
    if (!phone.trim()) return setError("El teléfono es lo que identifica al cliente")
    setError(null)

    // El teléfono va **tal como lo tipearon**: el backend lo compara normalizado
    // por su cuenta y lo muestra como se cargó. Normalizarlo acá sería una
    // segunda regla que se desincroniza.
    const base = { firstName: firstName.trim(), phone: phone.trim() }

    if (customer) {
      actualizar.mutate(
        {
          id: customer.id,
          ...base,
          lastName: lastName.trim() || null,
          email: email.trim() || null,
          dateOfBirth: dateOfBirth || null,
          notes: notes.trim() || null,
        },
        { onSuccess: onDone },
      )
      return
    }

    crear.mutate(
      {
        ...base,
        ...(lastName.trim() ? { lastName: lastName.trim() } : {}),
        ...(email.trim() ? { email: email.trim() } : {}),
        ...(dateOfBirth ? { dateOfBirth } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      },
      { onSuccess: onDone },
    )
  }

  return (
    <form onSubmit={submit} noValidate className="min-h-0 flex-1 space-y-4 overflow-y-auto px-0.5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="c-first" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
            Nombre
          </label>
          <input
            id="c-first"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            maxLength={100}
            autoFocus
            placeholder="María"
            className={control()}
          />
        </div>

        <div>
          <label htmlFor="c-last" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
            Apellido <span className="font-normal text-neutral-400">(opcional)</span>
          </label>
          <input
            id="c-last"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            maxLength={100}
            placeholder="González"
            className={control()}
          />
        </div>
      </div>

      <div>
        <label htmlFor="c-phone" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
          Teléfono
        </label>
        <input
          id="c-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="11 5555-1234"
          className={control()}
        />
        {/* El backend compara solo los dígitos, así que no hay un formato
            "correcto" que el usuario tenga que respetar. */}
        <p className="mt-1.5 text-xs text-neutral-400">
          Escribilo como quieras: se guarda igual y encuentra al mismo cliente.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="c-email" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
            Email <span className="font-normal text-neutral-400">(opcional)</span>
          </label>
          <input
            id="c-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="maria@ejemplo.com"
            className={control()}
          />
        </div>

        <div>
          <label htmlFor="c-dob" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
            Cumpleaños <span className="font-normal text-neutral-400">(opcional)</span>
          </label>
          <input
            id="c-dob"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className={control()}
          />
        </div>
      </div>

      <div>
        <label htmlFor="c-notes" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
          Notas <span className="font-normal text-neutral-400">(opcional)</span>
        </label>
        <textarea
          id="c-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={5000}
          rows={2}
          placeholder="Alérgica al amoníaco."
          className={cn(control(), "resize-none")}
        />
      </div>

      {duplicado ? (
        // Ámbar y no rojo: no hizo nada mal, hay que decidir algo.
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
          <p className="flex items-start gap-2 text-[13px] text-amber-900">
            <UserRoundSearch size={15} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
            <span>
              Ya tenés a <strong>{fullName(duplicado)}</strong> con ese teléfono. ¿Es esta persona?
            </span>
          </p>
          <button
            type="button"
            onClick={() => onOpenExisting(duplicado.id)}
            className={cn(cta({ variant: "outline", size: "sm" }), "mt-3")}
          >
            Abrir su ficha
          </button>
        </div>
      ) : (
        (error || fallo) && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
            <p className="text-[13px] text-red-600">
              {error ?? apiErrorMessage(fallo, "No pudimos guardar el cliente.")}
            </p>
          </div>
        )
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onDone} className={cn(cta({ variant: "outline", size: "sm" }))}>
          Cancelar
        </button>
        <button type="submit" disabled={guardando} className={cn(cta({ size: "sm" }))}>
          {guardando ? "Guardando…" : customer ? "Guardar" : "Crear cliente"}
        </button>
      </div>
    </form>
  )
}
