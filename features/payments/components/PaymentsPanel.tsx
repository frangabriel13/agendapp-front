"use client"

import { useState } from "react"
import { Link2, Loader2, Minus, Plus, RotateCw, Wallet } from "lucide-react"
import { cta } from "@/components/CtaLink"
import { cn } from "@/lib/utils"
import { apiErrorMessage } from "@/lib/errors"
import { formatCents } from "@/features/catalog/lib/money"
import type { Appointment, AppointmentBalance, AppointmentPayments, Payment } from "@/types"
import { useCreateCheckout, usePayments } from "../hooks/usePayments"
import {
  ESTADO_BADGE,
  ESTADO_LABEL,
  METODO_LABEL,
  TIPO_LABEL,
  linkPendiente,
  resumenSaldo,
  sePuedeCobrar,
  signo,
  type Tono,
} from "../lib/balance"
import { ChargeForm } from "./ChargeForm"
import { CheckoutLink } from "./CheckoutLink"

const CAJA: Record<Tono, string> = {
  emerald: "border-emerald-200 bg-emerald-50",
  amber: "border-amber-200 bg-amber-50",
  red: "border-red-200 bg-red-50",
  neutral: "border-black/[0.08] bg-neutral-50",
}

const TINTA: Record<Tono, string> = {
  emerald: "text-emerald-800",
  amber: "text-amber-800",
  red: "text-red-700",
  neutral: "text-neutral-800",
}

/**
 * La plata del turno: cuánto falta, cómo cobrarlo y qué se movió hasta ahora.
 *
 * **Vive dentro del turno y no en una pantalla propia** porque cobrar no es una
 * tarea aparte: se cobra mirando a quien vino, con el turno abierto adelante.
 *
 * El formulario se abre **acá adentro y no en otro diálogo**: un modal sobre otro
 * modal tapa justamente el número que hay que mirar mientras se carga el importe.
 */
export function PaymentsPanel({ appointment }: { appointment: Appointment }) {
  const query = usePayments(appointment.id)
  const [abierto, setAbierto] = useState<"cobrar" | "devolver" | null>(null)

  if (query.isPending) {
    return <div className="h-20 animate-pulse rounded-xl bg-neutral-100" />
  }

  if (query.isError) {
    return (
      <div className="rounded-xl border border-black/[0.08] bg-neutral-50 px-4 py-3">
        <p className="text-[13px] text-neutral-600">
          {apiErrorMessage(query.error, "No pudimos traer los cobros de este turno.")}
        </p>
        <button
          type="button"
          onClick={() => query.refetch()}
          className={cn(cta({ variant: "outline", size: "sm" }), "mt-2.5")}
        >
          <RotateCw size={14} aria-hidden />
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <Cobros
      appointment={appointment}
      datos={query.data}
      abierto={abierto}
      onAbrir={setAbierto}
      refrescando={query.isFetching}
    />
  )
}

function Cobros({
  appointment,
  datos,
  abierto,
  onAbrir,
  refrescando,
}: {
  appointment: Appointment
  datos: AppointmentPayments
  abierto: "cobrar" | "devolver" | null
  onAbrir: (que: "cobrar" | "devolver" | null) => void
  refrescando: boolean
}) {
  const { balance, payments } = datos
  const resumen = resumenSaldo(balance, appointment.status)
  const cobrable = sePuedeCobrar(appointment.status)
  const pendiente = linkPendiente(payments)
  // Lo que hay en caja por este turno. Un cobro online todavía pendiente no
  // cuenta: no entró nada, así que no hay nada que devolver.
  const hayPlata = balance.paidCents > 0

  return (
    <div className="space-y-3">
      <div className={cn("rounded-xl border px-4 py-3", CAJA[resumen.tono])}>
        <div className="flex items-baseline justify-between gap-2">
          <p className={cn("text-sm font-semibold", TINTA[resumen.tono])}>{resumen.titulo}</p>
          {/* Que se está volviendo a preguntar se dice bajito: mientras hay un
              cobro online esperando, esta consulta se repita sola cada 10 s y un
              spinner grande daría la sensación de que algo está trabado. */}
          {refrescando && <Loader2 size={13} className="shrink-0 animate-spin text-neutral-400" />}
        </div>
        {resumen.detalle && (
          <p className={cn("mt-0.5 text-xs", TINTA[resumen.tono], "opacity-80")}>{resumen.detalle}</p>
        )}
      </div>

      {pendiente?.checkoutUrl && (
        <CheckoutLink url={pendiente.checkoutUrl} amountCents={pendiente.amountCents} />
      )}

      {cobrable && abierto === null && (
        <div className="flex flex-wrap gap-2">
          {balance.dueCents > 0 && (
            <button type="button" onClick={() => onAbrir("cobrar")} className={cta({ size: "sm" })}>
              <Wallet size={15} aria-hidden />
              Cobrar
            </button>
          )}
          {/* Con un link vivo arriba, el botón sobra: pedirlo de nuevo devuelve
              ese mismo link (`reused: true`), así que sería un viaje para llegar
              a lo que ya está en pantalla. */}
          {balance.dueCents > 0 && pendiente === null && (
            <CheckoutButton appointmentId={appointment.id} balance={balance} />
          )}
          {hayPlata && (
            <button
              type="button"
              onClick={() => onAbrir("devolver")}
              className={cta({ variant: "outline", size: "sm" })}
            >
              <Minus size={15} aria-hidden />
              Devolver
            </button>
          )}
        </div>
      )}

      {abierto !== null && (
        <ChargeForm
          appointmentId={appointment.id}
          balance={balance}
          modo={abierto}
          onClose={() => onAbrir(null)}
        />
      )}

      {payments.length > 0 && <Movimientos payments={payments} />}
    </div>
  )
}

/**
 * Pide el link de pago online.
 *
 * **El nombre del botón dice qué va a cobrar el link.** Sin `paymentType` el
 * backend deduce —la seña si falta, el saldo si no—, y es la misma regla que
 * `cobroSugerido` usa para proponer el importe en efectivo: nombrarla acá es lo
 * que evita que alguien mande un link creyendo que cobra todo cuando cobra la
 * seña.
 *
 * No hace falta cuidarse del doble clic: pedir el mismo cobro dos veces devuelve
 * el link que ya existía (`reused: true`) en vez de generar otro.
 */
function CheckoutButton({
  appointmentId,
  balance,
}: {
  appointmentId: string
  balance: AppointmentBalance
}) {
  const checkout = useCreateCheckout(appointmentId)
  const seña = balance.depositAmountCents !== null && !balance.depositCovered

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={() => checkout.mutate(undefined)}
        disabled={checkout.isPending}
        className={cta({ variant: "outline", size: "sm" })}
      >
        <Link2 size={15} aria-hidden />
        {checkout.isPending ? "Generando…" : seña ? "Link para la seña" : "Link de pago"}
      </button>

      {checkout.isError && (
        <p className="text-xs text-neutral-600">
          {/* El 409 —"no queda nada por cobrar", "el turno está cancelado"— llega
              con el motivo ya escrito. El 502 es el único donde reintentar es lo
              correcto: no falló el cobro, no contestó el proveedor. */}
          {apiErrorMessage(checkout.error, "No pudimos generar el link. Probá de nuevo.")}
        </p>
      )}
    </div>
  )
}

function Movimientos({ payments }: { payments: Payment[] }) {
  return (
    <ul className="divide-y divide-black/[0.06] rounded-xl border border-black/[0.08]">
      {payments.map((payment) => (
        <li key={payment.id} className="flex items-start gap-3 px-3.5 py-2.5">
          <div
            aria-hidden
            className={cn(
              "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
              signo(payment) === -1
                ? "bg-red-50 text-red-600"
                : payment.status === "SUCCEEDED"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-neutral-100 text-neutral-500",
            )}
          >
            {signo(payment) === -1 ? <Minus size={13} /> : <Plus size={13} />}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <span className="text-[13px] font-medium text-neutral-900">
                {/* El importe de una devolución llega en positivo: sin el signo
                    se leería como un ingreso más. */}
                {signo(payment) === -1 ? "− " : ""}
                {formatCents(payment.amountCents)}
              </span>
              <span className="text-xs text-neutral-500">
                {TIPO_LABEL[payment.paymentType]} · {METODO_LABEL[payment.paymentMethod]}
              </span>
              <span
                className={cn(
                  "rounded-full border px-1.5 py-px text-[11px]",
                  ESTADO_BADGE[payment.status],
                )}
              >
                {ESTADO_LABEL[payment.status]}
              </span>
            </div>

            <p className="mt-0.5 text-[11px] text-neutral-400">
              {cuando(payment.paidAt ?? payment.createdAt)}
              {/* Quién lo cargó es el único rastro de un cobro que ningún sistema
                  externo puede confirmar. En los online es `null` a propósito. */}
              {payment.recordedBy &&
                ` · ${payment.recordedBy.firstName} ${payment.recordedBy.lastName.charAt(0)}.`}
            </p>

            {payment.notes && <p className="mt-1 text-xs text-neutral-600">{payment.notes}</p>}
            {payment.failureReason && (
              <p className="mt-1 text-xs text-red-600">{payment.failureReason}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

function cuando(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}
