/**
 * Plata del catálogo.
 *
 * **El backend guarda centavos y la pantalla muestra pesos.** `priceCents:
 * 1500000` son $15.000. Es el error más fácil de cometer en toda la pantalla —un
 * factor de 100 pasa desapercibido en el código y no en la factura—, así que la
 * conversión vive acá sola y nadie multiplica por 100 a mano.
 *
 * **Es el único formateador de plata de la app.** Antes convivía con un
 * `formatPrice` que recibía **pesos**, y esa convivencia ya costó dos bugs de
 * cien veces el monto: mientras existan los dos, alguien va a llamar al que no
 * era. `formatPrice` se borró.
 */

/**
 * Centavos → pesos, para poner en un input. `null` queda como cadena vacía.
 *
 * **Sale con coma decimal, no con el punto de `String(n)`.** No es cosmético: es
 * el mismo texto que después vuelve por `inputToCents`, y ahí el punto significa
 * separador de miles. Con `String(250050 / 100)` el campo mostraba `"2500.5"` y
 * al guardar sin tocar nada se releía como $25.005 — la seña se multiplicaba por
 * diez sola. El ida y vuelta tiene que cerrar.
 */
export function centsToInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return ""
  return String(cents / 100).replace(".", ",")
}

/**
 * Pesos escritos a mano → centavos.
 *
 * Devuelve `null` cuando no hay un número atrás: campo vacío, letras, o algo que
 * no se puede interpretar. El que llama decide si eso es "no pide seña" o un
 * error de validación — no es lo mismo en el precio que en la seña.
 *
 * Acepta la coma como separador decimal, que es como se escribe un precio acá.
 * El `Math.round` no es cosmético: `19.99 * 100` da `1998.9999…` en punto
 * flotante, y sin redondear se guardaría un centavo de menos.
 *
 * **El punto es ambiguo y se desambigua por la cantidad de dígitos que lo
 * siguen.** "15.000" son quince mil y "2.5" son dos con cincuenta: nadie escribe
 * un separador de miles que deje menos de tres cifras. Sin esta regla, alguien
 * que escribe el decimal con punto —costumbre de teclado numérico— carga cien
 * veces el precio que quería.
 */
export function inputToCents(value: string): number | null {
  const texto = value.trim()
  if (texto === "") return null

  // Con coma presente, el punto solo puede ser separador de miles.
  const limpio = texto.includes(",")
    ? texto.replace(/\./g, "").replace(",", ".")
    : texto.replace(/\.(?=\d{3}(\D|$))/g, "")

  const numero = Number(limpio)
  if (!Number.isFinite(numero) || numero < 0) return null

  return Math.round(numero * 100)
}

/** La del negocio, cuando se sabe. `null` mientras no hay sesión. */
let monedaDelNegocio: string | null = null

/**
 * Fija la moneda del negocio, una vez, al traer la sesión.
 *
 * **Es el mismo arreglo que `setBusinessTimezone`, y por el mismo motivo.** La
 * plata se formatea dentro de funciones puras —`resumenSaldo`, `revenueByService`,
 * `cobrosDelDia`— que no son componentes y no pueden leer un contexto de React.
 * Pasar la moneda por parámetro obligaría a enhebrarla por 45 llamadas y por cada
 * lib que las usa, y bastaría olvidarse en una para que un negocio uruguayo vea
 * un renglón en pesos argentinos.
 *
 * **Una moneda que `Intl` no conoce se ignora en vez de romper.** `toLocaleString`
 * tira `RangeError` con un código inválido, y eso dejaría al panel sin poder
 * mostrar un solo monto. Volver al peso argentino está mal, pero mucho menos mal
 * que una pantalla en blanco.
 */
export function setBusinessCurrency(currency: string | null | undefined): void {
  if (!currency) {
    monedaDelNegocio = null
    return
  }

  try {
    ;(0).toLocaleString("es-AR", { style: "currency", currency })
    monedaDelNegocio = currency
  } catch {
    monedaDelNegocio = null
  }
}

/**
 * Con qué moneda se está mostrando la plata.
 *
 * El default es ARS y no una excepción: el panel se dibuja una vez antes de que
 * llegue `/auth/me` —y las pantallas públicas no la traen nunca—, y la enorme
 * mayoría de los negocios cobra en pesos argentinos.
 */
export function businessCurrency(): string {
  return monedaDelNegocio ?? "ARS"
}

/**
 * Centavos → texto para mostrar.
 *
 * La moneda sale de `tenant.currency` —`/configuracion` la deja elegir— y el
 * parámetro queda para los casos donde el dato trae la suya, como un cobro que
 * `GET /payments` devuelve con su propio `currency`.
 */
export function formatCents(cents: number, currency = businessCurrency()): string {
  return (cents / 100).toLocaleString("es-AR", {
    style: "currency",
    currency,
    // Sin decimales cuando el monto es redondo, que es el caso normal de un
    // servicio; con decimales cuando de verdad los tiene, para no mentir.
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })
}

/** "1 h 30 min" a partir de los minutos. Más legible que "90 min" de una hora en adelante. */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`

  const horas = Math.floor(minutes / 60)
  const resto = minutes % 60
  const h = `${horas} h`

  return resto === 0 ? h : `${h} ${resto} min`
}

export interface DepositCheck {
  ok: boolean
  /** Qué mostrarle al usuario, o `null` si está bien. */
  error: string | null
}

/**
 * La seña no puede superar al precio.
 *
 * **Se valida en el front porque el backend rechaza el caso indirecto**: bajar el
 * precio por debajo de una seña ya cargada es 400 aunque el body no toque la
 * seña. Avisarlo antes de viajar es la diferencia entre corregir un campo y
 * recibir un error que no señala a ninguno.
 */
export function checkDeposit(priceCents: number, depositCents: number | null): DepositCheck {
  if (depositCents === null) return { ok: true, error: null }

  if (depositCents > priceCents) {
    return {
      ok: false,
      error: `La seña no puede ser mayor que el precio (${formatCents(priceCents)})`,
    }
  }

  return { ok: true, error: null }
}
