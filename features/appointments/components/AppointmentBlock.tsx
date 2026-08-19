"use client"

import type { CSSProperties } from "react"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { timeToMinutes } from "@/lib/time"
import type { Appointment } from "@/types"
import { elapsedFraction } from "../lib/agenda"
import { avatarStyle, blockLook, blockSkin } from "../lib/tone"
import { STATUS_LABELS } from "../lib/status"

/**
 * Debajo de este alto no entran el ícono, el servicio y el nombre en líneas
 * separadas, y el nombre termina cortado al ras del borde.
 */
const ALTO_COMPLETO = 66

interface Props {
  appointment: Appointment
  now: Date
  selected: boolean
  /** Alto del bloque en píxeles. Decide cuánto se puede mostrar adentro. */
  height: number
  /** El bloque comparte la columna con otro, así que sobra la mitad del ancho. */
  narrow: boolean
  /** Posición dentro de la columna. */
  style: CSSProperties
  onClick: () => void
}

/**
 * Un turno en el calendario.
 *
 * El bloque va del color de quien atiende y el relleno dice cómo viene el turno
 * (ver `blockLook`). Abajo, una barra con lo que ya transcurrió: los días
 * pasados llenos, el que está ocurriendo a medias, lo que viene vacío.
 */
export function AppointmentBlock({
  appointment,
  now,
  selected,
  height,
  narrow,
  style,
  onClick,
}: Props) {
  const { patient, professional, service, status } = appointment
  const look = blockLook(status)
  const skin = blockSkin(professional.color, look)
  const completo = height >= ALTO_COMPLETO && !narrow
  const avance = elapsedFraction(appointment, now)

  const chip = { background: skin.veil, color: skin.ink }

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ ...style, ...skin.box, color: skin.ink }}
      className={cn(
        "absolute flex flex-col gap-0.5 overflow-hidden rounded-xl px-2 py-1 text-left",
        "transition-transform hover:-translate-y-px hover:shadow-lg",
        selected && "z-30 ring-[2.5px] ring-neutral-900",
      )}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        {completo && (
          <span
            aria-hidden
            style={chip}
            className="flex size-[18px] shrink-0 items-center justify-center rounded-md"
          >
            <Sparkles size={11} />
          </span>
        )}
        <span
          aria-hidden
          style={avatarStyle(professional.color)}
          className="flex size-[18px] shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
        >
          {professional.name.charAt(0)}
        </span>
        {!completo && <span className={cn(nombre, status === "cancelled" && "line-through")}>{patient.name}</span>}
        {!narrow && (
          <span
            style={chip}
            className="ml-auto shrink-0 rounded-full px-1.5 py-px text-[9px] font-semibold"
          >
            {duracion(appointment)}
          </span>
        )}
      </span>

      {completo && (
        <>
          <span className={cn(nombre, status === "cancelled" && "line-through")}>{patient.name}</span>
          <span className="truncate text-[10px] leading-tight opacity-80">{service.name}</span>
        </>
      )}

      {/* Al pie y no arriba: es un dato de fondo, no algo que haya que leer. */}
      <span
        aria-hidden
        style={{ background: skin.veil }}
        className="mt-auto flex h-1 w-full overflow-hidden rounded-full"
      >
        <span
          style={{ background: skin.ink, width: `${avance * 100}%` }}
          className="h-full rounded-full opacity-90"
        />
      </span>

      <span className="sr-only">
        {appointment.startTime} a {appointment.endTime}, {patient.name}, {service.name}, con{" "}
        {professional.name}. {STATUS_LABELS[status]}.
      </span>
    </button>
  )
}

const nombre = "min-w-0 flex-1 truncate text-[12px] leading-tight font-semibold"

/** "45′" y "1 h 30": corto, porque compite con el nombre por el mismo renglón. */
function duracion(appointment: Appointment): string {
  const minutos = timeToMinutes(appointment.endTime) - timeToMinutes(appointment.startTime)
  if (minutos < 60) return `${minutos}′`
  if (minutos % 60 === 0) return `${minutos / 60} h`
  return `${Math.floor(minutos / 60)} h ${minutos % 60}`
}
