"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { timeToMinutes } from "@/lib/time"
import type { Appointment } from "@/types"
import { layoutDay } from "../lib/week"
import { AppointmentBlock } from "./AppointmentBlock"

/** La jornada que se dibuja. Fuera de esto no hay turnos que mostrar. */
export const HORA_INICIO = 8
export const HORA_FIN = 20

/**
 * Alto de una hora.
 *
 * No es un número redondo por gusto: con menos, un turno de una hora no tiene
 * lugar para el nombre y el servicio en líneas separadas y el texto termina
 * cortado contra el borde.
 */
export const ALTO_HORA = 72

export const ALTO_CABECERA = 68

export interface GridColumn {
  key: string
  header: ReactNode
  /** El negocio no abre: la columna va rayada. */
  closed?: boolean
  /** La columna de hoy, que lleva su banda. */
  today?: boolean
  appointments: Appointment[]
}

interface Props {
  columns: GridColumn[]
  now: Date
  /** Dibuja la línea de "ahora". Solo cuando el rango incluye hoy. */
  showNow: boolean
  selectedId: string | null
  /** Ancho mínimo antes de scrollear al costado. */
  minWidth: string
  onAppointmentClick: (appointment: Appointment) => void
  onSlotClick: (columnKey: string, time: string) => void
  /** Cartel cuando no hay ni un turno en todo el rango. */
  empty?: ReactNode
}

/**
 * La grilla de horas, compartida por la vista de semana y la de día.
 *
 * Las dos son lo mismo con distinta cabecera: columnas de tiempo, bloques
 * ubicados por hora y la línea de ahora cruzándolas. Tener una sola grilla evita
 * que las dos vistas se separen al primer retoque.
 */
export function TimeGrid({
  columns,
  now,
  showNow,
  selectedId,
  minWidth,
  onAppointmentClick,
  onSlotClick,
  empty,
}: Props) {
  const horas = Array.from({ length: HORA_FIN - HORA_INICIO }, (_, i) => HORA_INICIO + i)
  const alto = horas.length * ALTO_HORA
  const vacio = columns.every((column) => column.appointments.length === 0)

  const minutosAhora = now.getHours() * 60 + now.getMinutes()
  const dentroDeLaJornada = minutosAhora >= HORA_INICIO * 60 && minutosAhora <= HORA_FIN * 60

  return (
    /* El scroll lateral vive acá adentro: la tarjeta entera no se mueve. */
    <div className="overflow-x-auto border-t border-black/[0.06]">
      <div className={cn("flex", minWidth)}>
        <div className="w-[3.75rem] shrink-0">
          <div style={{ height: ALTO_CABECERA }} />
          {horas.map((hora) => (
            <div
              key={hora}
              style={{ height: ALTO_HORA }}
              className="pt-1 pr-2.5 text-right text-[11px] font-medium text-neutral-400"
            >
              {String(hora).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="grid" style={columnas(columns.length)}>
            {columns.map((column, index) => (
              <div
                key={column.key}
                style={{ height: ALTO_CABECERA }}
                className={cn(
                  index < columns.length - 1 && "border-r border-black/5",
                  column.today && "bg-violet-600/5",
                )}
              >
                {column.header}
              </div>
            ))}
          </div>

          <div className="relative border-t border-black/[0.06]">
            <div className="grid" style={columnas(columns.length)}>
              {columns.map((column, index) => {
                const carriles = layoutDay(column.appointments)

                return (
                  <div
                    key={column.key}
                    style={{ height: alto }}
                    className={cn(
                      "relative",
                      index < columns.length - 1 && "border-r border-black/5",
                      column.today && "bg-violet-600/5",
                    )}
                  >
                    {horas.map((hora) => (
                      <button
                        key={hora}
                        type="button"
                        aria-label={`Agendar a las ${hora}:00`}
                        onClick={() => onSlotClick(column.key, `${String(hora).padStart(2, "0")}:00`)}
                        style={{ height: ALTO_HORA }}
                        className="block w-full border-b border-black/[0.045] transition-colors hover:bg-violet-600/5"
                      />
                    ))}

                    {column.closed && (
                      <div
                        aria-hidden
                        className="hatch-diagonal pointer-events-none absolute inset-0 bg-neutral-100"
                      />
                    )}

                    {column.appointments.map((appointment) => {
                      const { lane, lanes } = carriles.get(appointment.id) ?? { lane: 0, lanes: 1 }
                      const arriba = posicion(appointment.startTime)
                      const altoBloque = Math.max(posicion(appointment.endTime) - arriba - 4, 24)
                      const ancho = 100 / lanes

                      return (
                        <AppointmentBlock
                          key={appointment.id}
                          appointment={appointment}
                          now={now}
                          selected={selectedId === appointment.id}
                          height={altoBloque}
                          narrow={lanes > 1}
                          style={{
                            top: arriba,
                            height: altoBloque,
                            left: `calc(${lane * ancho}% + 4px)`,
                            width: `calc(${ancho}% - 8px)`,
                            zIndex: 20,
                          }}
                          onClick={() => onAppointmentClick(appointment)}
                        />
                      )
                    })}
                  </div>
                )
              })}
            </div>

            {showNow && dentroDeLaJornada && (
              <div
                aria-hidden
                style={{ top: (minutosAhora - HORA_INICIO * 60) * (ALTO_HORA / 60) }}
                className="pointer-events-none absolute inset-x-0 z-40 flex items-center"
              >
                <span className="-ml-[5px] size-2.5 shrink-0 rounded-full bg-violet-600 ring-[3px] ring-violet-600/20" />
                <span className="h-px flex-1 bg-violet-600" />
              </div>
            )}

            {vacio && empty && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/75">
                {empty}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function columnas(count: number) {
  return { gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }
}

/** A qué altura cae una hora del reloj dentro de la grilla. */
function posicion(time: string): number {
  return (timeToMinutes(time) - HORA_INICIO * 60) * (ALTO_HORA / 60)
}
