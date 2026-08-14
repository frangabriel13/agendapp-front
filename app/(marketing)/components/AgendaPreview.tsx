const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const HOURS = ["09", "10", "11", "12", "13", "14", "15", "16"]

const TONES = {
  violet: "bg-violet-100/80 text-violet-800 border-l-violet-500",
  sky: "bg-sky-100/80 text-sky-800 border-l-sky-500",
  amber: "bg-amber-100/80 text-amber-800 border-l-amber-500",
  emerald: "bg-emerald-100/80 text-emerald-800 border-l-emerald-500",
} as const

interface Slot {
  /** Fila donde arranca, contando desde `HOURS[0]`. */
  row: number
  /** Alto en filas. */
  span: number
  tone: keyof typeof TONES
  label: string
}

/** Una semana de ejemplo, un array por columna. */
const WEEK: Slot[][] = [
  [
    { row: 0, span: 2, tone: "violet", label: "Limpieza facial" },
    { row: 4, span: 1, tone: "sky", label: "Consulta" },
  ],
  [
    { row: 1, span: 1, tone: "emerald", label: "Depilación" },
    { row: 3, span: 2, tone: "violet", label: "HIFU" },
    { row: 6, span: 1, tone: "amber", label: "Masaje" },
  ],
  [{ row: 0, span: 3, tone: "amber", label: "Liposonix" }],
  [
    { row: 2, span: 1, tone: "sky", label: "Consulta" },
    { row: 4, span: 2, tone: "violet", label: "Radiofrecuencia" },
  ],
  [
    { row: 1, span: 2, tone: "emerald", label: "Depilación" },
    { row: 5, span: 2, tone: "sky", label: "Peeling" },
  ],
  [{ row: 3, span: 2, tone: "violet", label: "Limpieza facial" }],
]

const ROW_HEIGHT = 34

/**
 * Maqueta de la agenda para el hero. Es una ilustración, no la app: va
 * `aria-hidden` para que no le meta ruido a un lector de pantalla.
 */
export function AgendaPreview() {
  return (
    <div aria-hidden className="overflow-hidden rounded-xl border border-black/[0.06] bg-white">
      {/*
        Ancho mínimo, y el padre recorta: en pantallas chicas la maqueta se asoma
        en vez de encogerse. Metida a la fuerza en 390px, las seis columnas dejan
        los turnos en "Li…" y "De…" —no muestra nada—; recortada se leen tres días
        de verdad y se entiende que hay más a la derecha.
      */}
      <div className="min-w-[42rem]">
        <div className="flex items-center gap-2 border-b border-black/[0.06] bg-neutral-50/80 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-neutral-200" />
            <span className="size-2.5 rounded-full bg-neutral-200" />
            <span className="size-2.5 rounded-full bg-neutral-200" />
          </div>
          <p className="ml-2 text-[11px] font-medium text-neutral-500">Agenda · Semana del 14 al 19</p>
          <span className="ml-auto rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-medium text-white">
            Nuevo turno
          </span>
        </div>

        <div className="flex text-[10px]">
          <div className="w-9 shrink-0 border-r border-black/[0.05]">
            <div className="h-8 border-b border-black/[0.05]" />
            {HOURS.map((h) => (
              <div
                key={h}
                className="flex items-start justify-end pr-1.5 pt-1 text-neutral-400"
                style={{ height: ROW_HEIGHT }}
              >
                {h}
              </div>
            ))}
          </div>

          <div className="grid flex-1 grid-cols-6">
            {WEEK.map((slots, day) => (
              <div key={DAYS[day]} className="border-r border-black/[0.05] last:border-r-0">
                <div className="flex h-8 items-center justify-center border-b border-black/[0.05] font-medium text-neutral-400">
                  {DAYS[day]}
                </div>
                <div className="relative" style={{ height: HOURS.length * ROW_HEIGHT }}>
                  {HOURS.map((h, i) => (
                    <div
                      key={h}
                      className="absolute inset-x-0 border-b border-black/[0.04]"
                      style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
                    />
                  ))}
                  {slots.map(({ row, span, tone, label }) => (
                    <div
                      key={label + row}
                      className={`absolute inset-x-1 truncate rounded border-l-2 px-1.5 py-1 font-medium ${TONES[tone]}`}
                      style={{ top: row * ROW_HEIGHT + 2, height: span * ROW_HEIGHT - 4 }}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
