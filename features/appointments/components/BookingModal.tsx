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
import type { RecurrenceFrequency, RecurringResult } from "@/types"
import { useBranches } from "@/features/branches/hooks/useBranches"
import { useServices, useServicesEmployees } from "@/features/catalog/hooks/useCatalog"
import { quienesPrestanTodos } from "@/features/catalog/lib/staff"
import { formatCents, formatDuration } from "@/features/catalog/lib/money"
import { useCustomers } from "@/features/customers/hooks/useCustomers"
import { useDebounced } from "@/features/customers/hooks/useDebounced"
import { fullName } from "@/features/customers/lib/customer"
import { useAvailability, useCreateAppointment, useCreateRecurring } from "../hooks/useAppointments"
import { motivoSinHorarios } from "../lib/slots"
import { canManage, useSession } from "@/features/auth/hooks/useAuth"
import { useSubscription } from "@/features/tenants/hooks/useTenant"
import { deudaVisible } from "@/features/tenants/lib/subscription"
import { FRECUENCIAS, resumenSerie } from "../lib/recurrence"

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
 * horario antes de saber cuánto dura el turno, que es la suma de los servicios.
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
  /** En el orden en que se eligieron: es como se leen después en el turno. */
  const [serviceIds, setServiceIds] = useState<string[]>([])
  const [branchId, setBranchId] = useState<string | null>(null)
  const [fecha, setFecha] = useState(dateToStr(day))
  const [slot, setSlot] = useState<{ startsAt: string; employeeId: string } | null>(null)
  /** `null` = cualquiera de los que presten todos esos servicios ahí. */
  const [employeeId, setEmployeeId] = useState<string | null>(null)
  const [repite, setRepite] = useState(false)
  const [frecuencia, setFrecuencia] = useState<RecurrenceFrequency>("WEEKLY")
  /** Cuenta **el primero**: 4 son cuatro turnos, no cinco. */
  const [veces, setVeces] = useState(4)

  const branches = useBranches()
  const services = useServices()
  const customers = useCustomers({ pageSize: 8, ...(busqueda ? { search: busqueda } : {}) })
  const { data: session } = useSession()
  const subscription = useSubscription()
  const agendar = useCreateAppointment()
  const serie = useCreateRecurring()

  const sucursal = branchId ?? branches.data?.[0]?.id ?? null
  const catalogo = services.data ?? []
  // `flatMap` sobre los ids y no `filter` sobre el catálogo: así el orden es el
  // de elección y no el del listado.
  const servicios = serviceIds.flatMap((id) => catalogo.find((s) => s.id === id) ?? [])
  const cliente = customers.data?.data.find((c) => c.id === customerId) ?? null

  /** Los que todavía se pueden sumar: activos y no elegidos ya. */
  const porAgregar = catalogo.filter(
    (service) => service.isActive && !serviceIds.includes(service.id),
  )

  /** Lo que se cobra y cuánto se está en el sillón. Los buffers van aparte. */
  const precio = servicios.reduce((total, s) => total + s.priceCents, 0)
  const duracion = servicios.reduce((total, s) => total + s.durationMinutes, 0)

  /**
   * Quiénes prestan **todos** los servicios elegidos en esa sucursal. Con uno es
   * la lista de siempre; con varios es la intersección, porque el turno lo
   * atiende una sola persona.
   */
  const staff = useServicesEmployees(serviceIds)
  const profesionales = quienesPrestanTodos(staff.listas ?? [], sucursal)

  const disponibilidad = useAvailability({
    branchId: sucursal,
    // Todos juntos: la duración del hueco es la suma, y preguntando por uno la
    // API ofrecía horarios donde el turno entero no entra.
    serviceIds,
    date: fecha,
    ...(employeeId ? { employeeId } : {}),
  })

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

  /**
   * **Un negocio recién creado no tiene ni sucursales ni servicios**, y lo primero
   * que hace cualquiera es apretar "Nuevo turno". Sin esto el formulario pide una
   * sucursal de una lista vacía y un servicio que no existe: un callejón sin
   * salida que además no explica qué falta. Se espera a que los dos listados
   * lleguen para no acusar de vacío a algo que todavía está cargando.
   */
  const listasListas = branches.data !== undefined && services.data !== undefined
  const faltaConfigurar = listasListas
    ? [
        branches.data.length === 0 && { que: "una sucursal", donde: "/sucursales" },
        catalogo.filter((service) => service.isActive).length === 0 && {
          que: "un servicio",
          donde: "/servicios",
        },
      ].filter((f) => f !== false)
    : []

  const aviso = deudaVisible(subscription.data)

  /**
   * Quién puede hacer algo con el aviso.
   *
   * Un `PROFESSIONAL` no puede pagar la suscripción —los endpoints le contestan
   * 403—, así que mandarlo a `/configuracion` sería mandarlo a mirar. El aviso lo
   * ve igual, porque le explica por qué no puede agendar; el atajo, no.
   */
  const puedePagar = canManage(session?.employee.role)

  /**
   * Tocar la lista de servicios invalida lo elegido más abajo: el horario porque
   * la duración cambió, y el profesional porque quien hacía uno puede no hacer el
   * otro —y un `employeeId` viejo filtra la disponibilidad a cero sin decir por
   * qué—.
   */
  const cambiarServicios = (siguiente: string[]) => {
    setServiceIds(siguiente)
    setSlot(null)
    setEmployeeId(null)
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!cliente || servicios.length === 0 || !sucursal || !slot) return

    const base = {
      branchId: sucursal,
      employeeId: slot.employeeId,
      customerId: cliente.id,
      serviceIds: servicios.map((s) => s.id),
      startsAt: slot.startsAt,
    }

    if (repite) {
      // **No se cierra al terminar**: el desenlace de una serie incluye qué
      // fechas quedaron afuera, y cerrar sería tirar ese dato.
      serie.mutate({ ...base, frequency: frecuencia, occurrences: veces })
      return
    }

    agendar.mutate(base, { onSuccess: onDone })
  }

  const error = agendar.error ?? serie.error
  const chocó = error instanceof ApiError && error.statusCode === 409 && !repite
  const debe = error instanceof ApiError && error.statusCode === 402
  const guardando = agendar.isPending || serie.isPending

  if (faltaConfigurar.length > 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
        <p className="flex items-start gap-2 text-[13px] text-amber-900">
          <TriangleAlert size={15} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
          <span>
            Antes de agendar falta cargar{" "}
            {faltaConfigurar.map((falta) => falta.que).join(" y ")}. Un turno es alguien
            atendiendo algo en algún lado: sin eso no hay nada que reservar.
          </span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {faltaConfigurar.map((falta) => (
            <Link
              key={falta.donde}
              href={falta.donde}
              className={cn(cta({ variant: "outline", size: "sm" }), "bg-white/70")}
            >
              Cargar {falta.que}
            </Link>
          ))}
        </div>
      </div>
    )
  }

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
              setEmployeeId(null)
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

      {/*
        **Se agregan de a uno a una lista, no se marcan en una grilla.** Un local
        puede tener treinta servicios y lo normal es un turno de uno: el selector
        se mantiene compacto y los elegidos quedan a la vista, con lo que se cobra
        y lo que dura cada uno. Es el mismo gesto que el cliente de arriba —elegir
        y ver lo elegido—, no un formulario nuevo.
      */}
      <div>
        {/* Sin `htmlFor` cuando no queda nada por agregar: el selector no está
            en el DOM y una etiqueta apuntando a un id inexistente es una promesa
            rota para quien navega con lector de pantalla. */}
        <label
          htmlFor={porAgregar.length > 0 ? "b-ser" : undefined}
          className="mb-1.5 block text-[13px] font-medium text-neutral-700"
        >
          Servicios
        </label>

        {servicios.length > 0 && (
          <ul className="mb-2 space-y-1.5">
            {servicios.map((service) => (
              <li
                key={service.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-black/10 px-3.5 py-2.5"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm text-neutral-900">{service.name}</span>
                  <span className="block text-xs text-neutral-500">
                    {formatDuration(service.durationMinutes)} · {formatCents(service.priceCents)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => cambiarServicios(serviceIds.filter((id) => id !== service.id))}
                  className="shrink-0 text-[13px] font-medium text-violet-600 hover:text-violet-500"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}

        {porAgregar.length > 0 && (
          <select
            id="b-ser"
            // Siempre vacío: es un "agregar", no un valor elegido. Lo elegido está
            // en la lista de arriba.
            value=""
            onChange={(e) => e.target.value && cambiarServicios([...serviceIds, e.target.value])}
            className={selectControl()}
          >
            <option value="">
              {servicios.length === 0 ? "Elegí un servicio" : "Agregar otro servicio"}
            </option>
            {porAgregar.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} — {formatDuration(service.durationMinutes)} —{" "}
                {formatCents(service.priceCents)}
              </option>
            ))}
          </select>
        )}

        {/* Con varios, las dos cosas que sorprenden: cuánto ocupa el turno y que
            lo atiende una sola persona —de ahí que la lista de profesionales se
            achique al agregar servicios—. */}
        {servicios.length > 1 && (
          <p className="mt-1.5 text-xs text-neutral-500">
            {formatDuration(duracion)} en total, con una sola persona atendiendo.
          </p>
        )}
      </div>

      {/*
        **Va después de los servicios y antes del horario**, que es el orden
        real: no se puede elegir quién atiende hasta saber qué se hace, y elegirlo
        recorta los horarios que se ofrecen abajo. Con varios servicios la lista
        se achica sola: son los que prestan **todos**.

        "Cualquiera" es el default y no un valor más: en un local chico es lo
        normal, y obligar a elegir persona antes de ver horarios escondería huecos
        que sí existen.
      */}
      {servicios.length > 0 && profesionales.length > 1 && (
        <div>
          <label htmlFor="b-emp" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
            Profesional
          </label>
          <select
            id="b-emp"
            value={employeeId ?? ""}
            onChange={(e) => {
              setEmployeeId(e.target.value || null)
              setSlot(null)
            }}
            className={selectControl()}
          >
            <option value="">Cualquiera</option>
            {profesionales.map((par) => (
              <option key={par.employeeId} value={par.employeeId}>
                {par.employeeName}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <span className="mb-2 block text-[13px] font-medium text-neutral-700">Horario</span>

        {servicios.length === 0 && (
          <p className="rounded-xl bg-neutral-50 px-3.5 py-3 text-[13px] text-neutral-500">
            Elegí un servicio y te mostramos los horarios libres.
          </p>
        )}

        {servicios.length > 0 && disponibilidad.isPending && (
          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-9 animate-pulse rounded-lg bg-neutral-100" />
            ))}
          </div>
        )}

        {servicios.length > 0 && disponibilidad.data && slots.length === 0 && (
          <p className="rounded-xl bg-neutral-50 px-3.5 py-3 text-[13px] text-neutral-500">
            {motivoSinHorarios(disponibilidad.data, servicios.length)}
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

      {/*
        **Repetir es una casilla y no otro formulario.** Es el mismo turno con dos
        datos más, y separarlo en otra pantalla obligaría a volver a elegir
        cliente, servicio y horario.
      */}
      {slot && (
        <div className="rounded-xl border border-black/[0.08] bg-neutral-50/60 p-3.5">
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={repite}
              onChange={(e) => setRepite(e.target.checked)}
              className="size-4 accent-violet-600"
            />
            <span className="text-[13px] font-medium text-neutral-800">Repetir este turno</span>
          </label>

          {repite && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="b-frec" className="mb-1.5 block text-xs font-medium text-neutral-600">
                  Cada cuánto
                </label>
                <select
                  id="b-frec"
                  value={frecuencia}
                  onChange={(e) => setFrecuencia(e.target.value as RecurrenceFrequency)}
                  className={selectControl()}
                >
                  {FRECUENCIAS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="b-veces" className="mb-1.5 block text-xs font-medium text-neutral-600">
                  Cuántos turnos
                </label>
                <input
                  id="b-veces"
                  type="number"
                  min={2}
                  max={52}
                  value={veces}
                  onChange={(e) => setVeces(Math.max(2, Math.min(52, Number(e.target.value) || 2)))}
                  className={control()}
                />
                {/* El backend cuenta el primero dentro de `occurrences`; decirlo
                    evita que alguien pida 4 y reciba 5. */}
                <p className="mt-1 text-xs text-neutral-400">Contando el de arriba.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {serie.data && <ResultadoSerie resultado={serie.data} onDone={onDone} />}

      <div className="flex items-center justify-between gap-3 pt-1">
        {/* Nombra **lo que falta**, no la lista entera: con el cliente y el
            servicio ya elegidos, "falta elegir cliente" manda a buscar algo que
            está hecho. */}
        <p className="text-xs text-neutral-400">
          {servicios.length > 0 && slot
            ? `${formatCents(precio)} · ${formatDuration(duracion)}`
            : `Falta ${[
                !cliente && "el cliente",
                servicios.length === 0 && "el servicio",
                !slot && "el horario",
              ]
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
            // `serie.data` significa que la serie ya se creó: sin esto el botón
            // seguía habilitado y un segundo clic agendaba todo de nuevo. El
            // desenlace de una serie es el panel de arriba, no otro intento.
            disabled={
              guardando || !cliente || servicios.length === 0 || !slot || serie.data !== undefined
            }
            className={cn(cta({ size: "sm" }))}
          >
            {guardando ? "Agendando…" : repite ? `Agendar ${veces} turnos` : "Agendar"}
          </button>
        </div>
      </div>
    </form>
  )
}

/**
 * Cómo terminó la serie.
 *
 * **Las fechas salteadas son el motivo de que esto exista.** El backend crea lo
 * que entra y devuelve el resto en `skipped` con el motivo; sin mostrarlas, quien
 * agendó una serie de seis se va convencido de que tiene seis turnos.
 */
function ResultadoSerie({
  resultado,
  onDone,
}: {
  resultado: RecurringResult
  onDone: () => void
}) {
  const resumen = resumenSerie(resultado)

  return (
    <div
      className={cn(
        "rounded-xl border px-3.5 py-3",
        resumen.hayHuecos ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50",
      )}
    >
      <p
        className={cn(
          "text-[13px] font-medium",
          resumen.hayHuecos ? "text-amber-900" : "text-emerald-800",
        )}
      >
        {resumen.titulo}
      </p>

      {resumen.hayHuecos && (
        <>
          <p className="mt-0.5 text-xs text-amber-800/80">
            Estas fechas quedaron afuera. Hay que resolverlas a mano:
          </p>
          <ul className="mt-2 space-y-1">
            {resultado.skipped.map((fecha) => {
              const { day, time } = splitInstant(fecha.startsAt)
              return (
                <li key={fecha.startsAt} className="text-xs text-amber-900">
                  <span className="font-medium">
                    {new Date(`${day}T12:00:00`).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    {time}
                  </span>{" "}
                  — {fecha.reason}
                </li>
              )
            })}
          </ul>
        </>
      )}

      <button
        type="button"
        onClick={onDone}
        className={cn(cta({ variant: "outline", size: "sm" }), "mt-3 bg-white/70")}
      >
        Listo
      </button>
    </div>
  )
}
