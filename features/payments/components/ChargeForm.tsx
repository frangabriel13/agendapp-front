"use client"

import { useState } from "react"
import { cta } from "@/components/CtaLink"
import { control, selectControl } from "@/components/form"
import { cn } from "@/lib/utils"
import { centsToInput, formatCents, inputToCents } from "@/features/catalog/lib/money"
import type { AppointmentBalance, ManualPaymentMethod, PaymentType } from "@/types"
import { useRecordManualPayment } from "../hooks/usePayments"
import { METODOS_MANUALES, METODO_LABEL, TIPO_LABEL, cobroSugerido } from "../lib/balance"

/** Los tipos que se pueden elegir al cobrar. `REFUND` no está: es el otro modo. */
const TIPOS_COBRO: PaymentType[] = ["DEPOSIT", "FULL", "REMAINDER"]

interface Props {
  appointmentId: string
  balance: AppointmentBalance
  /** Cobrar suma; devolver resta. Es el mismo formulario con el signo dado vuelta. */
  modo: "cobrar" | "devolver"
  onClose: () => void
}

/**
 * Carga plata que ya se movió en el mostrador.
 *
 * **Nace acreditada**, a diferencia del link online: quien la registra está
 * viendo el efectivo. Por eso el backend guarda quién fue —es el único rastro de
 * un movimiento que ningún sistema externo puede confirmar— y por eso
 * `MERCADOPAGO` no es una opción acá: ese pago solo lo puede crear el checkout.
 *
 * El importe viene propuesto pero **es editable**: alguien puede dejar $2.000 a
 * cuenta de una seña de $5.000, y un campo bloqueado obligaría a inventar un
 * movimiento que no fue.
 */
export function ChargeForm({ appointmentId, balance, modo, onClose }: Props) {
  const devolucion = modo === "devolver"
  const sugerido = cobroSugerido(balance)

  const [importe, setImporte] = useState(
    centsToInput(devolucion ? Math.max(balance.paidCents, 0) : (sugerido?.amountCents ?? 0)),
  )
  const [tipo, setTipo] = useState<PaymentType>(
    devolucion ? "REFUND" : (sugerido?.paymentType ?? "FULL"),
  )
  const [metodo, setMetodo] = useState<ManualPaymentMethod>("CASH")
  const [nota, setNota] = useState("")
  const [error, setError] = useState<string | null>(null)

  const registrar = useRecordManualPayment(appointmentId)

  const cents = inputToCents(importe)

  /**
   * El importe se pasa de lo que corresponde.
   *
   * **El backend acepta los dos excesos sin decir nada**, y ese es justamente el
   * motivo del aviso: cobrar $150.000 en un turno de $1.500 —el error de tipeo de
   * cien veces, que en centavos es de una sola tecla— devuelve 201, deja el saldo
   * en cero y la pantalla diciendo "Pagado". Nada volvería a mencionarlo.
   *
   * **Avisa y no bloquea.** Los dos excesos pueden ser correctos: una propina, un
   * paquete de sesiones cobrado en el primer turno, una compensación acordada al
   * cancelar. Impedirlos sería inventar una regla que el negocio no tiene.
   */
  const deMas =
    cents !== null && cents > (devolucion ? balance.paidCents : balance.dueCents)

  function submit(event: React.FormEvent) {
    event.preventDefault()

    if (cents === null) return setError("Poné un importe")
    if (cents <= 0) return setError("El importe tiene que ser mayor que cero")

    setError(null)
    registrar.mutate(
      {
        amountCents: cents,
        paymentType: tipo,
        paymentMethod: metodo,
        // Se omite si está vacía: el backend corre con `forbidNonWhitelisted` y
        // un campo de más devuelve 400.
        ...(nota.trim() ? { notes: nota.trim() } : {}),
      },
      { onSuccess: onClose },
    )
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="space-y-3 rounded-xl border border-black/[0.08] bg-neutral-50/60 p-3.5"
    >
      <p className="text-[13px] font-medium text-neutral-800">
        {devolucion ? "Registrar una devolución" : "Registrar un cobro"}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="p-importe" className="mb-1.5 block text-xs font-medium text-neutral-600">
            Importe
          </label>
          <div className="relative">
            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-neutral-400">
              $
            </span>
            <input
              id="p-importe"
              value={importe}
              onChange={(e) => setImporte(e.target.value)}
              inputMode="decimal"
              autoFocus
              className={cn(control(error), "pl-7")}
            />
          </div>
        </div>

        <div>
          <label htmlFor="p-metodo" className="mb-1.5 block text-xs font-medium text-neutral-600">
            Cómo
          </label>
          <select
            id="p-metodo"
            value={metodo}
            onChange={(e) => setMetodo(e.target.value as ManualPaymentMethod)}
            className={selectControl()}
          >
            {METODOS_MANUALES.map((m) => (
              <option key={m} value={m}>
                {METODO_LABEL[m]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!devolucion && (
        <div>
          <label htmlFor="p-tipo" className="mb-1.5 block text-xs font-medium text-neutral-600">
            Concepto
          </label>
          <select
            id="p-tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as PaymentType)}
            className={selectControl()}
          >
            {TIPOS_COBRO.map((t) => (
              <option key={t} value={t}>
                {TIPO_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="p-nota" className="mb-1.5 block text-xs font-medium text-neutral-600">
          Nota <span className="font-normal text-neutral-400">(opcional)</span>
        </label>
        <input
          id="p-nota"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          maxLength={200}
          placeholder={devolucion ? "Canceló con 48 h" : "Pagó con $20.000"}
          className={control()}
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      {deMas && !error && (
        <p className="text-xs text-amber-700">
          {devolucion
            ? `Estás devolviendo más de los ${formatCents(balance.paidCents)} que entraron por este turno.`
            : `Estás cobrando más de los ${formatCents(balance.dueCents)} que faltan.`}
        </p>
      )}

      <div className="flex gap-2 pt-0.5">
        <button type="submit" disabled={registrar.isPending} className={cta({ size: "sm" })}>
          {registrar.isPending ? "Guardando…" : devolucion ? "Registrar devolución" : "Registrar cobro"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className={cta({ variant: "outline", size: "sm" })}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
