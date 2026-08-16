"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { controlClasses, selectClasses } from "@/components/form"
import { cn } from "@/lib/utils"
import type { RefundType, TenantSettings } from "@/types"
import { useUpdateSettings } from "../hooks/useTenant"
import { REFUND_TYPES } from "../lib/options"
import { Field, SettingsCard } from "./SettingsCard"

export function BookingSection({ settings, canSave }: { settings: TenantSettings; canSave: boolean }) {
  const [hours, setHours] = useState(String(settings.cancellationPolicyHours))
  const [refundType, setRefundType] = useState<RefundType>(settings.cancellationRefundType)
  const [percentage, setPercentage] = useState(String(settings.cancellationRefundPercentage ?? 50))
  const [requireDeposit, setRequireDeposit] = useState(settings.requireDepositForBooking)
  const [buffer, setBuffer] = useState(String(settings.defaultBufferMinutes))
  const update = useUpdateSettings()

  const horas = Number(hours)
  const porcentaje = Number(percentage)
  const colchon = Number(buffer)

  const problem = !Number.isInteger(horas) || horas < 0
    ? "Las horas de anticipación tienen que ser un número entero"
    : !Number.isInteger(colchon) || colchon < 0
      ? "El colchón entre turnos tiene que ser un número entero"
      : refundType === "PARTIAL" && (!Number.isInteger(porcentaje) || porcentaje < 1 || porcentaje > 100)
        ? "El porcentaje tiene que estar entre 1 y 100"
        : null

  return (
    <SettingsCard
      title="Reservas y cancelaciones"
      description="Qué pasa cuando alguien cancela, y cuánto aire dejar entre turnos."
      canSave={canSave}
      saving={update.isPending}
      problem={problem}
      onSave={() =>
        update.mutate({
          cancellationPolicyHours: horas,
          cancellationRefundType: refundType,
          // El porcentaje solo tiene sentido con reintegro parcial; en los otros
          // casos se omite en vez de mandar un número que no se usa.
          ...(refundType === "PARTIAL" ? { cancellationRefundPercentage: porcentaje } : {}),
          requireDepositForBooking: requireDeposit,
          defaultBufferMinutes: colchon,
        })
      }
    >
      <Field
        label="Anticipación para cancelar sin costo"
        htmlFor="hours"
        hint="Cancelar con menos aviso que esto queda sujeto a la política de reintegro."
      >
        <div className="flex items-center gap-2">
          <input
            id="hours"
            type="number"
            min={0}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            disabled={!canSave}
            className={cn(controlClasses, "w-28 border-black/10")}
          />
          <span className="text-[13px] text-neutral-500">horas antes del turno</span>
        </div>
      </Field>

      <Field label="Qué pasa si cancelan tarde" htmlFor="refundType">
        <select
          id="refundType"
          value={refundType}
          onChange={(e) => setRefundType(e.target.value as RefundType)}
          disabled={!canSave}
          className={cn(selectClasses, "border-black/10")}
        >
          {REFUND_TYPES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-neutral-400">
          {REFUND_TYPES.find((r) => r.value === refundType)?.hint}
        </p>
      </Field>

      {refundType === "PARTIAL" && (
        <Field label="Porcentaje a devolver" htmlFor="percentage">
          <div className="flex items-center gap-2">
            <input
              id="percentage"
              type="number"
              min={1}
              max={100}
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              disabled={!canSave}
              className={cn(controlClasses, "w-28 border-black/10")}
            />
            <span className="text-[13px] text-neutral-500">% de lo pagado</span>
          </div>
        </Field>
      )}

      <Field
        label="Colchón entre turnos"
        htmlFor="buffer"
        hint="Minutos libres que se reservan después de cada turno, para limpiar o preparar."
      >
        <div className="flex items-center gap-2">
          <input
            id="buffer"
            type="number"
            min={0}
            value={buffer}
            onChange={(e) => setBuffer(e.target.value)}
            disabled={!canSave}
            className={cn(controlClasses, "w-28 border-black/10")}
          />
          <span className="text-[13px] text-neutral-500">minutos</span>
        </div>
      </Field>

      <div className="flex items-start justify-between gap-4 rounded-xl border border-black/[0.07] bg-neutral-50 px-4 py-3">
        <div>
          <p className="text-[13px] font-medium text-neutral-900">Pedir seña para reservar</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Los turnos quedan pendientes de pago hasta que se abone la seña.
          </p>
        </div>
        <Switch
          checked={requireDeposit}
          onCheckedChange={setRequireDeposit}
          disabled={!canSave}
          aria-label="Pedir seña para reservar"
        />
      </div>
    </SettingsCard>
  )
}
