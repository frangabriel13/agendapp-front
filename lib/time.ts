export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

export function minutesToTime(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${dosCifras(h)}:${dosCifras(m)}`
}

export function addMinutes(time: string, minutes: number): string {
  return minutesToTime(timeToMinutes(time) + minutes)
}

/**
 * Un día de calendario a partir de un `Date`, "YYYY-MM-DD".
 *
 * **Lee los getters locales, y tiene que seguir haciéndolo.** Forma un par con
 * `parseCalendarDay`: los dos viven en el mundo de los días de calendario —el que
 * usan el calendario, la grilla del mes y la navegación entre semanas—, donde un
 * `Date` es un casillero y no un instante. Hacer que esto mire la zona del
 * negocio rompería ese par: `new Date(2026, 8, 7)` es medianoche local y en una
 * zona más atrasada se leería como el 6.
 *
 * **La zona del negocio entra en el otro par**, `splitInstant`/`toInstant`, que es
 * donde se cruzan instantes y horas de pared.
 */
export function dateToStr(date: Date): string {
  return `${date.getFullYear()}-${dosCifras(date.getMonth() + 1)}-${dosCifras(date.getDate())}`
}

/**
 * La inversa de `dateToStr`: convierte "YYYY-MM-DD" a una fecha local.
 *
 * **No usar `new Date("2026-12-25")`**: la spec obliga a interpretar ese formato
 * como UTC, así que en una zona negativa —toda América— se corre un día para
 * atrás y el 25 se muestra como 24. Armando la fecha por partes se interpreta en
 * la zona local, que es lo que representa un día de calendario.
 */
export function parseCalendarDay(date: string): Date {
  const [year, month, day] = date.split("-").map(Number)
  return new Date(year!, month! - 1, day!)
}

/**
 * # La zona horaria del negocio
 *
 * **La API manda instantes y el calendario dibuja horas de pared.** Son dos cosas
 * distintas: `2026-08-27T19:00:00.000Z` son las 16:00 en Buenos Aires y las 21:00
 * en Madrid. Convertir de una a otra necesita una zona, y **la del navegador no
 * sirve**: es la de quien mira, no la del negocio.
 *
 * Durante mucho tiempo esto usó la zona del navegador con la excusa de que "el
 * panel lo abre gente que trabaja ahí". La excusa se cae en tres casos que no son
 * raros: la máquina de desarrollo (que suele estar en UTC y mostraba todo corrido
 * tres horas), alguien de viaje, y un negocio con sucursales en dos zonas.
 *
 * La zona se guarda en el módulo y no se pasa por parámetro **porque la conversión
 * ocurre fuera de React**: `toAppointment` la hace al traer los turnos, dentro de
 * un `queryFn`, donde no hay contexto ni hooks. Pasarla por argumento obligaría a
 * llevarla a mano por cada capa hasta ahí.
 */
let zonaDelNegocio: string | null = null

/** La zona del navegador. Es lo que se usa mientras no se sepa la del negocio. */
function zonaDelNavegador(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Fija la zona del negocio. La llama el panel apenas tiene la sesión.
 *
 * **Una zona inválida se ignora en vez de romper.** `Intl.DateTimeFormat` tira
 * excepción con un nombre que no conoce, y eso dejaría la app entera sin poder
 * dibujar una sola fecha: seguir con la del navegador es peor que lo correcto pero
 * infinitamente mejor que una pantalla en blanco.
 */
export function setBusinessTimezone(timezone: string | null | undefined): void {
  if (!timezone) {
    zonaDelNegocio = null
    return
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone })
    zonaDelNegocio = timezone
  } catch {
    zonaDelNegocio = null
  }
}

/** La zona con la que se está trabajando. La del negocio si se sabe; si no, la del navegador. */
export function businessTimezone(): string {
  return zonaDelNegocio ?? zonaDelNavegador()
}

interface Partes {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

/**
 * Las partes de un instante leídas en una zona.
 *
 * `hourCycle: "h23"` y no `hour12: false`: con el segundo, algunos motores
 * devuelven "24" para la medianoche.
 */
function partesEn(timezone: string, instante: Date): Partes {
  const formato = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  const partes: Record<string, string> = {}
  for (const parte of formato.formatToParts(instante)) partes[parte.type] = parte.value

  return {
    year: Number(partes.year),
    month: Number(partes.month),
    day: Number(partes.day),
    hour: Number(partes.hour),
    minute: Number(partes.minute),
    second: Number(partes.second),
  }
}

/** Cuánto está adelantada la zona respecto de UTC en ese instante, en milisegundos. */
function desfase(utcMs: number, timezone: string): number {
  const p = partesEn(timezone, new Date(utcMs))
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - utcMs
}

/**
 * Un instante ISO de la API, partido en día de calendario y hora de reloj **del
 * negocio**.
 *
 * Es el único lugar donde un instante se convierte en hora de pared. Todo lo que
 * dibuja el calendario trabaja en horas de pared —es lo que es una grilla—, y
 * hacer la cuenta en cada componente es cómo se cuelan los errores de zona.
 */
export function splitInstant(iso: string): { day: string; time: string } {
  const p = partesEn(businessTimezone(), new Date(iso))

  return {
    day: `${p.year}-${dosCifras(p.month)}-${dosCifras(p.day)}`,
    time: `${dosCifras(p.hour)}:${dosCifras(p.minute)}`,
  }
}

/** La hora de pared de una fecha **local**, "HH:MM". Para `Date`s ya en hora del negocio. */
export function clockTime(date: Date): string {
  return `${dosCifras(date.getHours())}:${dosCifras(date.getMinutes())}`
}

/**
 * El camino inverso: un día y una hora **del negocio**, como instante ISO.
 *
 * Lo necesita `POST /appointments`, que recibe `startsAt`.
 *
 * **El desfase se calcula dos veces a propósito.** La primera pasada supone que la
 * hora de pared es UTC para averiguar cuánto corre la zona; pero si esa suposición
 * cae del otro lado de un cambio de horario de verano, el desfase que usó es el
 * equivocado. La segunda pasada lo mide en el instante ya corregido. Sin eso, los
 * turnos del fin de semana en que cambia la hora se guardan corridos una hora —en
 * Argentina hoy no pasa, pero Chile, Brasil y México están en la lista de zonas
 * que ofrece el panel.
 */
export function toInstant(day: string, time: string): string {
  const [year, month, date] = day.split("-").map(Number)
  const [hours, minutes] = time.split(":").map(Number)

  const zona = businessTimezone()
  const supuesto = Date.UTC(year!, month! - 1, date!, hours!, minutes!)

  const primero = desfase(supuesto, zona)
  const segundo = desfase(supuesto - primero, zona)

  return new Date(supuesto - segundo).toISOString()
}

/**
 * El reloj del negocio, en un `Date` que se lee con los getters locales.
 *
 * **No es el instante actual, y ahí está toda la gracia.** Está corrido a
 * propósito para que `getHours()`, `getDate()` y `dateToStr()` devuelvan la hora y
 * el día del negocio sin que cada componente sepa de zonas. Todo lo que dibuja la
 * agenda —la línea de "ahora", qué turno está en curso, qué casillero es hoy—
 * vive en horas de pared y funciona tal cual.
 *
 * **Lo que no se puede hacer es compararlo con un instante.** `businessNow() <
 * new Date(appointment.startsAt)` da cualquier cosa: uno es un reloj de pared
 * disfrazado de instante y el otro es un instante de verdad. Para eso está
 * `Date.now()`, como en el corte de slots pasados del formulario de agendar.
 */
export function businessNow(): Date {
  const p = partesEn(businessTimezone(), new Date())
  return new Date(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
}

/** El día de calendario del negocio, "YYYY-MM-DD". No siempre es el del navegador. */
export function today(): string {
  const p = partesEn(businessTimezone(), new Date())
  return `${p.year}-${dosCifras(p.month)}-${dosCifras(p.day)}`
}

/**
 * El primer y el último día de un mes, "YYYY-MM-DD" los dos y los dos incluidos.
 * `month` es "YYYY-MM".
 *
 * **Es un par de días de calendario, no un rango de instantes**, así que no
 * interviene ninguna zona horaria: quien lo recibe decide qué significa "ese día"
 * —`GET /payments` los interpreta en la zona del negocio—. Un rango mal calculado
 * no falla: se pierde un día de plata en silencio.
 */
export function monthRange(month: string): { from: string; to: string } {
  const [year, monthNumber] = month.split("-").map(Number)
  // El día 0 del mes siguiente es el último del actual: así no hay que saber
  // cuántos días tiene febrero ni tratar diciembre aparte.
  return { from: `${month}-01`, to: dateToStr(new Date(year!, monthNumber!, 0)) }
}

function dosCifras(n: number): string {
  return String(n).padStart(2, "0")
}
