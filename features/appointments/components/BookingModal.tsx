"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { CalendarClock, CreditCard, TriangleAlert, UserRoundSearch } from "lucide-react"
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
import { ApiError } from "@/lib/api"
import { dateToStr, splitInstant } from "@/lib/time"
import { useBranches } from "@/features/branches/hooks/useBranches"
import { useServices } from "@/features/catalog/hooks/useCatalog"
import { formatCents, formatDuration } from "@/features/catalog/lib/money"
import { useCustomers } from "@/features/customers/hooks/useCustomers"
import { useDebounced } from "@/features/customers/hooks/useDebounced"
import { fullName } from "@/features/customers/lib/customer"
import { useAvailability, useCreateAppointment } from "../hooks/useAppointments"
import { canManage, useSession } from "@/features/auth/hooks/useAuth"
import { useSubscription } from "@/features/tenants/hooks/useTenant"
import { deudaVisible } from "@/features/tenants/lib/subscription"

interface Props {
  open: boolean
  /** Día que estaba mirando la agenda. Es el que se propone. */
  day: Date
  onClose: () => void
}

/**
 * Agendar un turno.
 *
 * El orden de los campos es el del mostrador: **primero quién viene**, después
 * qué se hace, y recién ahí los horarios posibles. Al revés obligaría a elegir un
 * horario antes de saber cuánto dura el servicio.
 */
export function BookingModal({ open, day, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex max-h-[88vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo turno</DialogTitle>
          <DialogDescription>Quién viene, qué se hace y a qué hora.</DialogDescription>
        </DialogHeader>

        {open && <BookingForm key={dateToStr(day)} day={day} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function BookingForm({ day, onDone }: { day: Date; onDone: () => void }) {
  const [texto, setTexto] = useState("")
  const busqueda = useDebounced(texto)
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [serviceId, setServiceId] = useState<string | null>(null)
  const [branchId, setBranchId] = useState<string | null>(null)
  const [fecha, setFecha] = useState(dateToStr(day))
  const [slot, setSlot] = useState<{ startsAt: string; employeeId: string } | null>(null)

  const branches = useBranches()
  const services = useServices()
  const customers = useCustomers({ pageSize: 8, ...(busqueda ? { search: busqueda } : {}) })
  const { data: session } = useSession()
  const subscription = useSubscription()
  const agendar = useCreateAppointment()

  const sucursal = branchId ?? branches.data?.[0]?.id ?? null
  const servicio = services.data?.find((s) => s.id === serviceId) ?? null
  const cliente = customers.data?.data.find((c) => c.id === customerId) ?? null

  const disponibilidad = useAvailability({ branchId: sucursal, serviceId, date: fecha })

  /**
   * `availability` **no recorta los slots que ya pasaron**: describe lo que el
   * horario permite, no lo que todavía se puede reservar. Filtrarlos es
   * responsabilidad de la pantalla.
   */
  const llegada = disponibilidad.dataUpdatedAt
  const slots = useMemo(
    () =>
      // El corte es **el momento en que llegó la respuesta**, no el reloj de cada
      // render: leerlo durante el render no es puro, y además haría que un
      // horario desapareciera solo mientras el usuario lo está mirando.
      (disponibilidad.data?.slots ?? []).filter((s) => new Date(s.startsAt).getTime() > llegada),
    [disponibilidad.data, llegada],
  )

  const aviso = deudaVisible(subscription.data)

  /**
   * Quién puede hacer algo con el aviso.
   *
   * Un `PROFESSIONAL` no puede pagar la suscripción —los endpoints le contestan
   * 403—, así que mandarlo a `/configuracion` sería mandarlo a mirar. El aviso lo
   * ve igual, porque le explica por qué no puede agendar; el atajo, no.
   */
  const puedePagar = canManage(session?.employee.role)

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!cliente || !servicio || !sucursal || !slot) return

    agendar.mutate(
      {
        branchId: sucursal,
        employeeId: slot.employeeId,
        customerId: cliente.id,
        serviceIds: [servicio.id],
        startsAt: slot.startsAt,
      },
      { onSuccess: onDone },
    )
  }

  const error = agendar.error
  const chocó = error instanceof ApiError && error.statusCode === 409
  const debe = error instanceof ApiError && error.statusCode === 402

  return (
    <form onSubmit={submit} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-0.5">
      {/* El aviso va **antes** de que intente agendar: enterarse de que el
          negocio debe la suscripción recién al apretar el botón es tarde. */}
      {aviso && !debe && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
          <CreditCard size={15} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
          <p className="text-[13px] text-amber-900">
            {aviso}{" "}
            {puedePagar && (
              <Link href="/configuracion" className="font-medium underline underline-offset-2">
                Pagarlo ahora
              </Link>
            )}
          </p>
        </div>
      )}

      <div>
        <label htmlFor="b-cli" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
          Cliente
        </label>
        {cliente ? (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-black/10 px-3.5 py-2.5">
            <span className="min-w-0">
              <span className="block truncate text-sm text-neutral-900">{fullName(cliente)}</span>
              <span className="block truncate text-xs text-neutral-500">{cliente.phone}</span>
            </span>
            <button
              type="button"
              onClick={() => setCustomerId(null)}
              className="shrink-0 text-[13px] font-medium text-violet-600 hover:text-violet-500"
            >
              Cambiar
            </button>
          </div>
        ) : (
          <>
            <input
              id="b-cli"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Buscar por nombre o teléfono"
              autoFocus
              className={control()}
            />
            {texto && (
              <ul className="mt-1.5 max-h-40 overflow-y-auto rounded-xl border border-black/[0.07]">
                {(customers.data?.data ?? []).map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setCustomerId(c.id)}
                      className="flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left transition-colors hover:bg-neutral-50"
                    >
                      <span className="truncate text-[13px] text-neutral-900">{fullName(c)}</span>
                      <span className="shrink-0 text-xs text-neutral-400">{c.phone}</span>
                    </button>
                  </li>
                ))}
                {customers.data?.data.length === 0 && (
                  <li className="flex items-center gap-2 px-3.5 py-3 text-[13px] text-neutral-500">
                    <UserRoundSearch size={14} aria-hidden className="text-neutral-400" />
                    No encontramos a nadie. Cargalo primero en Clientes.
                  </li>
                )}
              </ul>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="b-suc" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
            Sucursal
          </label>
          <select
            id="b-suc"
            value={sucursal ?? ""}
            onChange={(e) => {
              setBranchId(e.target.value)
              setSlot(null)
            }}
            className={selectControl()}
          >
            {(branches.data ?? []).map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="b-fec" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
            Día
          </label>
          <input
            id="b-fec"
            type="date"
            value={fecha}
            onChange={(e) => {
              setFecha(e.target.value)
              setSlot(null)
            }}
            className={control()}
          />
        </div>
      </div>

      <div>
        <label htmlFor="b-ser" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
          Servicio
        </label>
        <select
          id="b-ser"
          value={serviceId ?? ""}
          onChange={(e) => {
            setServiceId(e.target.value || null)
            setSlot(null)
          }}
          className={selectControl()}
        >
          <option value="">Elegí un servicio</option>
          {(services.data ?? [])
            .filter((service) => service.isActive)
            .map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} — {formatDuration(service.durationMinutes)} —{" "}
                {formatCents(service.priceCents)}
              </option>
            ))}
        </select>
      </div>

      <div>
        <span className="mb-2 block text-[13px] font-medium text-neutral-700">Horario</span>

        {!serviceId && (
          <p className="rounded-xl bg-neutral-50 px-3.5 py-3 text-[13px] text-neutral-500">
            Elegí un servicio y te mostramos los horarios libres.
          </p>
        )}

        {serviceId && disponibilidad.isPending && (
          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-9 animate-pulse rounded-lg bg-neutral-100" />
            ))}
          </div>
        )}

        {serviceId && disponibilidad.data && slots.length === 0 && (
          // `branchClosed` distingue "cerrado" de "sin lugar": los dos devuelven
          // `slots: []` pero el cartel que corresponde es distinto.
          <p className="rounded-xl bg-neutral-50 px-3.5 py-3 text-[13px] text-neutral-500">
            {disponibilidad.data.branchClosed
              ? "Ese día la sucursal está cerrada."
              : "No queda ningún horario libre ese día."}
          </p>
        )}

        {slots.length > 0 && (
          <>
            <div className="grid grid-cols-4 gap-1.5">
              {slots.map((s) => {
                const hora = splitInstant(s.startsAt).time
                const primero = s.employees[0]
                const elegido = slot?.startsAt === s.startsAt

                return (
                  <button
                    key={s.startsAt}
                    type="button"
                    disabled={!primero}
                    onClick={() =>
                      primero && setSlot({ startsAt: s.startsAt, employeeId: primero.employeeId })
                    }
                    title={s.employees.map((e) => e.employeeName).join(", ")}
                    className={cn(
                      "rounded-lg border py-2 text-[13px] transition-colors",
                      elegido
                        ? "border-violet-600 bg-violet-600 text-white"
                        : "border-black/10 text-neutral-700 hover:border-violet-400",
                    )}
                  >
                    {hora}
                  </button>
                )
              })}
            </div>
            {/* El slot dura duración + buffer, así que el último del día termina
                antes del cierre. Decirlo evita que parezca que falta un horario. */}
            <p className="mt-2 text-xs text-neutral-400">
              Incluye {disponibilidad.data?.bufferAfterMinutes ?? 0} min de limpieza después.
            </p>
          </>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className={cn(
            "rounded-xl border px-3.5 py-3",
            chocó || debe ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50",
          )}
        >
          {chocó ? (
            // 409: alguien tomó el hueco primero. **No es un error a reintentar**:
            // lo correcto es refrescar la disponibilidad y ofrecer otro horario.
            <>
              <p className="flex items-start gap-2 text-[13px] text-amber-900">
                <CalendarClock size={15} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
                <span>Alguien tomó ese horario mientras elegías. Elegí otro.</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  setSlot(null)
                  agendar.reset()
                  void disponibilidad.refetch()
                }}
                className={cn(cta({ variant: "outline", size: "sm" }), "mt-3")}
              >
                Ver los horarios libres
              </button>
            </>
          ) : debe ? (
            // 402 y no 403 justamente para poder distinguirlo de un problema de
            // permisos. Ver, cancelar y reprogramar siguen andando: no se bloquea
            // la app entera.
            <div className="flex items-start gap-2 text-[13px] text-amber-900">
              <TriangleAlert size={15} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
              <div>
                <p>
                  {apiErrorMessage(error, "Hay un pago de la suscripción pendiente.")} Mientras
                  tanto podés ver, cancelar y reprogramar los turnos que ya tenés.
                </p>
                {/* El error dice qué pasa; el link dice qué hacer. Sin esto el
                    cartel es un callejón sin salida: enterarse de que hay que
                    pagar sin poder pagar. */}
                {puedePagar && (
                  <Link
                    href="/configuracion"
                    className={cn(cta({ size: "sm" }), "mt-3")}
                  >
                    <CreditCard size={15} aria-hidden />
                    Pagar la suscripción
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-red-600">
              {apiErrorMessage(error, "No pudimos agendar el turno.")}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-1">
        {/* Nombra **lo que falta**, no la lista entera: con el cliente y el
            servicio ya elegidos, "falta elegir cliente" manda a buscar algo que
            está hecho. */}
        <p className="text-xs text-neutral-400">
          {servicio && slot
            ? `${formatCents(servicio.priceCents)} · ${formatDuration(servicio.durationMinutes)}`
            : `Falta ${[!cliente && "el cliente", !servicio && "el servicio", !slot && "el horario"]
                .filter(Boolean)
                .join(", ")
                .replace(/, ([^,]*)$/, " y $1")}.`}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={onDone} className={cn(cta({ variant: "outline", size: "sm" }))}>
            Cancelar
          </button>
          <button
            type="submit"
            disabled={agendar.isPending || !cliente || !servicio || !slot}
            className={cn(cta({ size: "sm" }))}
          >
            {agendar.isPending ? "Agendando…" : "Agendar"}
          </button>
        </div>
      </div>
    </form>
  )
}
