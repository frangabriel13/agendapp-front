"use client"

import { cn } from "@/lib/utils"
import type { Professional } from "@/types"
import type { MonthCell } from "../lib/agenda"

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

interface Props {
  cells: MonthCell[]
  /** El día más cargado del mes: contra él se mide la barra de los demás. */
  busiest: number
  professionals: Map<string, Professional>
  onPickDay: (key: string) => void
}

/**
 * El mes: volumen, no detalle.
 *
 * No entran los turnos uno por uno —no hay lugar y para eso está la semana—, así
 * que cada día muestra cuántos hay, quiénes atienden y una barra de carga.
 *
 * **La barra se mide contra el día más cargado del mes, no contra un cupo.** La
 * agenda no conoce los horarios del equipo —eso lo sabe el calendario de Inicio,
 * que sí los pide a la API—, así que un "70% lleno" acá sería un número sin nada
 * atrás.
 */
export function MonthGrid({ cells, busiest, professionals, onPickDay }: Props) {
  return (
    <div className="border-t border-black/[0.06] px-5 pt-4 pb-5">
      <div className="grid grid-cols-7 gap-1.5 pb-2 sm:gap-2">
        {DIAS.map((dia) => (
          <p key={dia} className="truncate text-center text-[11px] font-medium text-neutral-400">
            <span className="hidden sm:inline">{dia}</span>
            <span className="sm:hidden">{dia.slice(0, 3)}</span>
          </p>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {cells.map((cell) => (
          <Celda
            key={cell.key}
            cell={cell}
            busiest={busiest}
            professionals={professionals}
            onClick={() => onPickDay(cell.key)}
          />
        ))}
      </div>

      <p className="pt-3.5 text-[11px] text-neutral-400">
        Los puntos son quién atiende ese día. La barra compara la carga contra el día más movido
        del mes.
      </p>
    </div>
  )
}

function Celda({
  cell,
  busiest,
  professionals,
  onClick,
}: {
  cell: MonthCell
  busiest: number
  professionals: Map<string, Professional>
  onClick: () => void
}) {
  if (!cell.inMonth) {
    return <div aria-hidden className="h-20 sm:h-[5.75rem]" />
  }

  const carga = busiest === 0 ? 0 : cell.count / busiest

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-20 flex-col rounded-xl border p-2 text-left transition-colors sm:h-[5.75rem] sm:p-2.5",
        cell.isToday
          ? "border-violet-600 bg-violet-50 shadow-[0_6px_16px_-10px_rgba(124,58,237,0.8)]"
          : cell.isSunday
            ? "hatch-diagonal border-black/[0.06] bg-neutral-100"
            : "border-black/[0.06] bg-white hover:border-black/15",
      )}
    >
      <span className="flex items-center justify-between gap-1">
        <span
          className={cn(
            "text-[13px] font-semibold",
            cell.isToday ? "text-violet-700" : "text-neutral-900",
          )}
        >
          {cell.day}
        </span>
        {cell.count > 0 && (
          <span className="rounded-full bg-neutral-100 px-1.5 text-[10px] font-semibold text-neutral-600">
            {cell.count}
          </span>
        )}
      </span>

      {cell.count > 0 && (
        <>
          <span aria-hidden className="flex gap-[3px] pt-1.5">
            {cell.professionals.map((id) => (
              <span
                key={id}
                style={{ background: professionals.get(id)?.color ?? "#a3a3a3" }}
                className="size-1.5 rounded-full"
              />
            ))}
          </span>
          <span
            aria-hidden
            className="mt-auto flex h-1.5 w-full overflow-hidden rounded-full bg-neutral-200"
          >
            <span
              className="h-full rounded-full bg-violet-500"
              style={{ width: `${carga * 100}%` }}
            />
          </span>
          <span className="sr-only">
            {cell.count} turno{cell.count === 1 ? "" : "s"}
          </span>
        </>
      )}
    </button>
  )
}
