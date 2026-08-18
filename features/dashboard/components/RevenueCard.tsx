"use client"

import { useMemo } from "react"
import { Receipt, TrendingDown, TrendingUp } from "lucide-react"
import { Panel, PanelHeader, PanelLink } from "@/components/Panel"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/format"
import {
  dayRevenue,
  monthLabel,
  monthOutlook,
  weekToDateRevenue,
} from "@/features/reports/lib/revenue"
import type { Appointment } from "@/types"

/**
 * Cómo viene la plata, en tres cortes.
 *
 * El mes manda: ocupa el ancho completo y se lleva el número grande. Debajo, el
 * pulso corto —lo que va de la semana y lo de hoy—, en dos cuadros anchos. El
 * detalle por servicio y por profesional vive en `/reportes`.
 *
 * El mes anterior no tiene cuadro propio: ya está en el chip de variación, que
 * es la forma útil de ese dato —cuánto mejor o peor vas— y no un número suelto
 * que hay que restar de cabeza.
 *
 * Recibe los turnos en vez de pedirlos: hoy salen de datos de ejemplo y mañana
 * de la API, y esta tarjeta no tiene por qué enterarse.
 */
export function RevenueCard({ appointments }: { appointments: Appointment[] }) {
  // La fecha se fija al montar: recalcularla en cada render movería los cortes
  // "hasta hoy" debajo del mouse al cruzar la medianoche.
  const hoy = useMemo(() => new Date(), [])

  const { outlook, semana, dia } = useMemo(
    () => ({
      outlook: monthOutlook(appointments, hoy),
      semana: weekToDateRevenue(appointments, hoy),
      dia: dayRevenue(appointments, hoy),
    }),
    [appointments, hoy],
  )

  const mesAnterior = monthLabel(outlook.mesAnterior)

  return (
    <Panel className="flex flex-col">
      <PanelHeader
        title="Facturación"
        badge={<Periodo mes={monthLabel(outlook.mes)} />}
        action={<PanelLink href="/reportes">Ver reportes</PanelLink>}
      />

      <div className="flex flex-1 flex-col gap-2.5 px-5 pb-5">
        {/*
          Todo centrado y el número a la escala del cuadro. Alineado a la
          izquierda y en 26px, el cuadro se estiraba hasta el alto de las
          tarjetas vecinas y quedaba una caja enorme con un número chico
          flotando en una esquina.
        */}
        <div
          className={cn(
            "flex flex-[1.5] flex-col items-center justify-center gap-3 rounded-2xl px-4 py-5 text-center",
            "border border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100/50",
          )}
        >
          <Rotulo tono="violeta">Este mes</Rotulo>
          <p className="text-[32px] leading-none font-semibold tracking-tight text-violet-950 tabular-nums xl:text-[38px] 2xl:text-[44px]">
            {formatPrice(outlook.actual)}
          </p>
          <Variacion valor={outlook.variacion} mesAnterior={mesAnterior} />
        </div>

        {/*
          Dos columnas en todos los anchos, sin breakpoint: con solo dos cuadros
          hay lugar de sobra hasta en un teléfono, y `flex-1` los hace altos para
          que el violeta de arriba no se estire de más.
        */}
        <div className="grid flex-1 grid-cols-2 gap-2.5">
          <Cuadro label="Esta semana" valor={semana.total} nota={turnos(semana.turnos)} />
          <Cuadro label="Hoy" valor={dia.total} nota={turnos(dia.turnos)} />
        </div>
      </div>
    </Panel>
  )
}

function turnos(cantidad: number): string {
  return cantidad === 0 ? "sin turnos" : `${cantidad} ${cantidad === 1 ? "turno" : "turnos"}`
}

function Periodo({ mes }: { mes: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.07] bg-neutral-50 px-2.5 py-1 text-[11px] font-medium text-neutral-600">
      <Receipt size={12} aria-hidden />
      {mes}
    </span>
  )
}

function Rotulo({ children, tono }: { children: React.ReactNode; tono?: "violeta" }) {
  return (
    <p
      className={cn(
        "max-w-full truncate text-[10px] font-medium tracking-[0.08em] uppercase",
        tono === "violeta" ? "text-violet-700/70" : "text-neutral-400",
      )}
    >
      {children}
    </p>
  )
}

interface CuadroProps {
  label: string
  /** `null` cuando no hay registro de ese período: se muestra `vacio`, no un cero. */
  valor: number | null
  nota: string
  vacio?: string
}

function Cuadro({ label, valor, nota, vacio = "—" }: CuadroProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-black/[0.06] bg-neutral-50/70 px-3 py-4 text-center">
      <Rotulo>{label}</Rotulo>
      <p
        className={cn(
          "max-w-full truncate text-[19px] leading-none font-semibold tracking-tight tabular-nums 2xl:text-[22px]",
          valor === null ? "text-neutral-400" : "text-neutral-900",
        )}
      >
        {valor === null ? vacio : formatPrice(valor)}
      </p>
      <p className="max-w-full truncate text-[11px] text-neutral-400">{nota}</p>
    </div>
  )
}

/**
 * Contra qué se mide el mes.
 *
 * Sin historial no se dibuja una píldora apagada que parezca un dato en cero: se
 * dice en texto que todavía no hay contra qué comparar.
 */
function Variacion({ valor, mesAnterior }: { valor: number | null; mesAnterior: string }) {
  if (valor === null) {
    return <p className="text-[11px] text-violet-900/40">Sin mes anterior para comparar</p>
  }

  const sube = valor >= 0
  const Icon = sube ? TrendingUp : TrendingDown

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        sube ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800",
      )}
    >
      <Icon size={12} aria-hidden className="shrink-0" />
      <span className="truncate">
        {sube ? "+" : "−"}
        {Math.abs(Math.round(valor * 100))}% vs. {mesAnterior.toLowerCase()}
      </span>
    </span>
  )
}
