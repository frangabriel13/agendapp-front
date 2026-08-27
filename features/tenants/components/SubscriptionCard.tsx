"use client"

import { useState } from "react"
import { Check, Copy, CreditCard, ExternalLink, RotateCw } from "lucide-react"
import { cta } from "@/components/CtaLink"
import { cn } from "@/lib/utils"
import { apiErrorMessage } from "@/lib/errors"
import { formatCents } from "@/features/catalog/lib/money"
import type { Subscription, SubscriptionCheckout, SubscriptionPayment, Tenant } from "@/types"
import { useSubscription, useSubscriptionCheckout } from "../hooks/useTenant"
import {
  PAGO_BADGE,
  PAGO_LABEL,
  estadoSuscripcion,
  fecha,
  periodo,
  sePuedePagar,
  textoDelPago,
  type TonoSuscripcion,
} from "../lib/subscription"

const CAJA: Record<TonoSuscripcion, string> = {
  emerald: "border-emerald-200 bg-emerald-50",
  amber: "border-amber-200 bg-amber-50",
  red: "border-red-200 bg-red-50",
  neutral: "border-black/[0.08] bg-neutral-50",
}

const TINTA: Record<TonoSuscripcion, string> = {
  emerald: "text-emerald-800",
  amber: "text-amber-800",
  red: "text-red-700",
  neutral: "text-neutral-800",
}

/**
 * La cuenta que el negocio le paga a reservApp.
 *
 * **Solo la ve quien puede**: `GET /tenants/me/subscription` pide `OWNER` o
 * `ADMINISTRATIVE` y a un profesional le contesta 403. La pantalla lo decide
 * antes de montar esto (`canManage`), no acá: un profesional no tiene por qué ver
 * cuánto paga su empleador, así que la tarjeta directamente no existe para él.
 */
export function SubscriptionCard({ tenant }: { tenant: Tenant }) {
  const query = useSubscription()

  if (query.isPending) {
    return <div className="h-40 animate-pulse rounded-2xl bg-neutral-100" />
  }

  if (query.isError) {
    return (
      <div className="rounded-2xl border border-black/[0.07] bg-white px-6 py-5">
        <p className="text-[13px] text-neutral-600">
          {apiErrorMessage(query.error, "No pudimos traer los datos de tu suscripción.")}
        </p>
        <button
          type="button"
          onClick={() => query.refetch()}
          className={cn(cta({ variant: "outline", size: "sm" }), "mt-3")}
        >
          <RotateCw size={14} aria-hidden />
          Reintentar
        </button>
      </div>
    )
  }

  return <Tarjeta tenant={tenant} subscription={query.data} />
}

function Tarjeta({ tenant, subscription }: { tenant: Tenant; subscription: Subscription }) {
  const estado = estadoSuscripcion(subscription)
  const checkout = useSubscriptionCheckout()
  const { plan } = tenant

  const limite = (valor: number | null) => (valor === null ? "Sin límite" : String(valor))

  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[13px] text-neutral-500">Plan contratado</p>
          <p className="text-[15px] font-semibold tracking-tight text-neutral-900">
            {subscription.plan.name}
            {subscription.plan.priceMonthlyCents !== null && (
              <span className="ml-1.5 text-[13px] font-normal text-neutral-500">
                {formatCents(subscription.plan.priceMonthlyCents)} por mes
              </span>
            )}
          </p>
        </div>
      </div>

      <div className={cn("mt-4 rounded-xl border px-4 py-3", CAJA[estado.tono])}>
        <p className={cn("text-sm font-semibold", TINTA[estado.tono])}>{estado.titulo}</p>
        <p className={cn("mt-0.5 text-xs", TINTA[estado.tono], "opacity-80")}>{estado.detalle}</p>
      </div>

      {/* El link recién pedido manda sobre el botón: es a dónde hay que ir. */}
      {checkout.data ? (
        <LinkDeSuscripcion checkout={checkout.data} />
      ) : (
        <Pagar subscription={subscription} checkout={checkout} />
      )}

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
        <Dato label="Profesionales" valor={limite(plan.maxEmployees)} />
        <Dato label="Sucursales" valor={limite(plan.maxBranches)} />
        <Dato label="Ficha clínica" valor={plan.includesClinicRecords ? "Incluida" : "No incluida"} />
        <Dato label="Soporte" valor={plan.supportLevel === "PRIORITY" ? "Prioritario" : "Estándar"} />
      </dl>

      {subscription.payments.length > 0 && <Historial payments={subscription.payments} />}
    </div>
  )
}

function Pagar({
  subscription,
  checkout,
}: {
  subscription: Subscription
  checkout: ReturnType<typeof useSubscriptionCheckout>
}) {
  if (!sePuedePagar(subscription)) {
    return (
      <p className="mt-3 text-xs leading-relaxed text-neutral-500">
        Tu plan se cotiza con soporte, así que no se paga desde acá. Escribinos y lo vemos con vos.
      </p>
    )
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => checkout.mutate()}
        disabled={checkout.isPending}
        className={cta({ size: "sm" })}
      >
        <CreditCard size={15} aria-hidden />
        {checkout.isPending ? "Generando…" : textoDelPago(subscription)}
      </button>

      {checkout.isError && (
        <p className="mt-2 text-xs text-neutral-600">
          {apiErrorMessage(checkout.error, "No pudimos generar el link. Probá de nuevo.")}
        </p>
      )}
    </div>
  )
}

/**
 * El link para pagar el mes.
 *
 * **Dice qué período cubre, y no es un detalle.** Pedir el checkout estando al día
 * genera el cobro del **mes siguiente**: sin las fechas, alguien paga sin saber
 * qué mes está pagando y con razón cree que pagó dos veces el mismo.
 */
function LinkDeSuscripcion({ checkout }: { checkout: SubscriptionCheckout }) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(checkout.checkoutUrl)
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 2000)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-[13px] font-medium text-amber-900">
        {formatCents(checkout.amountCents)} — {periodo(checkout.periodStart, checkout.periodEnd)}
      </p>
      <p className="mt-0.5 text-xs text-amber-800/80">
        {/* El mismo malentendido que en el cobro de un turno: el link no cobra. */}
        Todavía no está pago. La cuenta se pone al día cuando pagues y nos avise Mercado Pago.
      </p>

      <div className="mt-2.5 flex flex-wrap gap-2">
        <a
          href={checkout.checkoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(cta({ size: "sm" }))}
        >
          <ExternalLink size={14} aria-hidden />
          Ir a pagar
        </a>
        <button
          type="button"
          onClick={copiar}
          className={cn(cta({ variant: "outline", size: "sm" }), "border-amber-300 bg-white/70")}
        >
          {copiado ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
          {copiado ? "Copiado" : "Copiar link"}
        </button>
      </div>
    </div>
  )
}

function Historial({ payments }: { payments: SubscriptionPayment[] }) {
  return (
    <div className="mt-5 border-t border-black/[0.06] pt-4">
      <p className="mb-2 text-xs text-neutral-400">Cobros</p>
      <ul className="divide-y divide-black/[0.06]">
        {payments.map((payment) => (
          <li key={payment.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 py-2">
            <span className="text-[13px] font-medium text-neutral-900">
              {formatCents(payment.amountCents)}
            </span>
            <span className="text-xs text-neutral-500">
              {periodo(payment.periodStart, payment.periodEnd)}
            </span>
            <span
              className={cn("rounded-full border px-1.5 py-px text-[11px]", PAGO_BADGE[payment.status])}
            >
              {PAGO_LABEL[payment.status]}
            </span>
            <span className="ml-auto text-[11px] text-neutral-400">
              {payment.paidAt ? fecha(payment.paidAt) : fecha(payment.createdAt)}
            </span>
            {payment.failureReason && (
              <p className="w-full text-xs text-red-600">{payment.failureReason}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs text-neutral-400">{label}</dt>
      <dd className="text-[13px] font-medium text-neutral-900">{valor}</dd>
    </div>
  )
}
